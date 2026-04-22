import { ChangeEvent, type ReactNode, useMemo, useRef, useState } from 'react';
import { Database, Package2, Search, Upload, type LucideIcon } from 'lucide-react';

import { InventoryTree } from '@/components/InventoryTree';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { countAllItems, readPlayers, searchItemsAcrossPlayers, summarizeItemsByClassname } from '@/lib/parser';
import { getSqlModule } from '@/lib/sql';
import { steamIdToUid } from '@/lib/steam';
import { cn } from '@/lib/utils';
import type { PlayerRecord, PlayerStatEntry } from '@/types';

interface ViewState {
  players: PlayerRecord[];
  filteredPlayers: PlayerRecord[];
  selectedUid: string | null;
  statusMessage: string;
  hasError: boolean;
  fileLoaded: boolean;
}

const initialState: ViewState = {
  players: [],
  filteredPlayers: [],
  selectedUid: null,
  statusMessage: 'Select a player database to begin.',
  hasError: false,
  fileLoaded: false
};

const steamIdPattern = /^\d{17}$/;
const steamIdAliasStorageKey = 'dayz-player-db-editor-steam-id-aliases';
const primaryStatKeys = ['playtime', 'dist', 'infected_killed', 'players_killed', 'longest_survivor_hit'] as const;
const beneficialConditionKeys = new Set([
  'mdf_antibiotics_state',
  'mdf_charcoal_state',
  'mdf_epinephrine_state',
  'mdf_immunityboost_state',
  'mdf_mask_state',
  'mdf_morphine_state',
  'mdf_painkillers_state'
]);
const statLabelMap: Record<string, string> = {
  dist: 'Distance travelled',
  infected_killed: 'Infected killed',
  longest_survivor_hit: 'Longest hit',
  players_killed: 'Players killed',
  playtime: 'Playtime',
  mdf_antibiotics_state: 'Antibiotics',
  mdf_brain_state: 'Brain disease',
  mdf_broken_legs_state: 'Broken legs',
  mdf_charcoal_state: 'Charcoal tablets',
  mdf_cholera_state: 'Cholera',
  mdf_common_cold_state: 'Common cold',
  mdf_contamination1_state: 'Contamination',
  mdf_epinephrine_state: 'Epinephrine',
  mdf_fatigue_state: 'Fatigue',
  mdf_fever_state: 'Fever',
  mdf_heatbuffer_state: 'Heat buffer',
  mdf_hemolytic_reaction_state: 'Hemolytic reaction',
  mdf_immunityboost_state: 'Immunity boost',
  mdf_influenza_state: 'Influenza',
  mdf_mask_state: 'Mask effect',
  mdf_morphine_state: 'Morphine',
  mdf_painkillers_state: 'Painkillers',
  mdf_pneumonia_state: 'Pneumonia',
  mdf_poisoning_state: 'Poisoning',
  mdf_salmonella_state: 'Salmonella',
  mdf_unconsciousness_state: 'Unconscious',
  mdf_wetness_state: 'Wetness',
  mdf_wound_infection1_state: 'Wound infection I',
  mdf_wound_infection2_state: 'Wound infection II'
};

function loadStoredSteamIdAliases(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(steamIdAliasStorageKey);

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string')
    );
  } catch {
    return {};
  }
}

function persistSteamIdAliases(aliases: Record<string, string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(steamIdAliasStorageKey, JSON.stringify(aliases));
  } catch {
    // Ignore storage failures and keep aliases in memory.
  }
}

function App() {
  const [viewState, setViewState] = useState<ViewState>(initialState);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showInventorySummary, setShowInventorySummary] = useState(false);
  const [showItemMetadata, setShowItemMetadata] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(true);
  const [steamIdAliases, setSteamIdAliases] = useState<Record<string, string>>(loadStoredSteamIdAliases);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPlayer = useMemo(
    () => viewState.players.find((player) => player.uid === viewState.selectedUid) ?? null,
    [viewState.players, viewState.selectedUid]
  );
  const selectedPlayerPrimaryStats = useMemo(
    () => getPrimaryStatEntries(selectedPlayer),
    [selectedPlayer]
  );
  const selectedPlayerActiveConditions = useMemo(
    () => getActiveConditionEntries(selectedPlayer),
    [selectedPlayer]
  );
  const selectedPlayerAllStats = useMemo(
    () => getSortedStatEntries(selectedPlayer),
    [selectedPlayer]
  );

  const alivePlayers = useMemo(
    () => viewState.players.filter((player) => player.alive).length,
    [viewState.players]
  );

  const handleDatabaseChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsLoading(true);
    setSearchQuery('');
    setItemSearchQuery('');
    setShowInventorySummary(false);
    setShowItemMetadata(false);
    setShowPlayerStats(true);
    setViewState({
      ...initialState,
      statusMessage: `Loading ${file.name}...`
    });

    try {
      const sqlModule = await getSqlModule();
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const database = new sqlModule.Database(fileBytes);
      const players = readPlayers(database);
      database.close();

      setViewState({
        players,
        filteredPlayers: players,
        selectedUid: players[0]?.uid ?? null,
        statusMessage: `Loaded ${players.length} player record${players.length === 1 ? '' : 's'} from ${file.name}.`,
        hasError: false,
        fileLoaded: true
      });
    } catch (error) {
      console.error(error);
      setViewState({
        ...initialState,
        statusMessage: error instanceof Error ? error.message : 'Failed to load the database.',
        hasError: true
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    const trimmedQuery = query.trim();
    const normalizedQuery = trimmedQuery.toLowerCase();
    const searchedSteamId = steamIdPattern.test(trimmedQuery) ? trimmedQuery : null;
    const convertedUid = searchedSteamId ? await steamIdToUid(searchedSteamId) : null;

    if (searchedSteamId !== null && convertedUid !== null) {
      setSteamIdAliases((currentAliases) => {
        if (currentAliases[convertedUid] === searchedSteamId) {
          return currentAliases;
        }

        const nextAliases = {
          ...currentAliases,
          [convertedUid]: searchedSteamId
        };

        persistSteamIdAliases(nextAliases);
        return nextAliases;
      });
    }

    setViewState((currentState: ViewState) => {
      const filteredPlayers = currentState.players.filter((player) => {
        if (!normalizedQuery) {
          return true;
        }

        return player.uid.toLowerCase().includes(normalizedQuery)
          || (steamIdAliases[player.uid] ?? '').includes(trimmedQuery)
          || (convertedUid !== null && player.uid === convertedUid)
          || (player.characterName ?? '').toLowerCase().includes(normalizedQuery);
      });

      const selectedUid = filteredPlayers.some((player) => player.uid === currentState.selectedUid)
        ? currentState.selectedUid
        : filteredPlayers[0]?.uid ?? null;

      return {
        ...currentState,
        filteredPlayers,
        selectedUid
      };
    });
  };

  const selectPlayer = (uid: string) => {
    setViewState((currentState: ViewState) => ({
      ...currentState,
      selectedUid: uid
    }));
  };

  const totalSelectedItems = selectedPlayer ? countAllItems(selectedPlayer.items) : 0;
  const selectedPlayerSummary = useMemo(
    () => (selectedPlayer ? summarizeItemsByClassname(selectedPlayer.items) : []),
    [selectedPlayer]
  );
  const itemSearchResults = useMemo(
    () => searchItemsAcrossPlayers(viewState.players, itemSearchQuery),
    [itemSearchQuery, viewState.players]
  );

  const deadPlayers = viewState.players.length - alivePlayers;
  const statusTone = viewState.hasError ? 'destructive' : viewState.fileLoaded ? 'secondary' : 'outline';
  const statusLabel = isLoading ? 'Loading' : viewState.fileLoaded ? 'Ready' : 'Idle';

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const getPreferredPlayerId = (uid: string) => steamIdAliases[uid] ?? uid;
  const getPreferredPlayerIdLabel = (uid: string) => steamIdAliases[uid] ? 'Steam64' : 'DayZ UID';

  const selectedPlayerSteamId = selectedPlayer ? steamIdAliases[selectedPlayer.uid] ?? null : null;
  const selectedPlayerDataBytes = selectedPlayer?.data.length ?? 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 p-3 md:p-4">
        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-border/80 bg-card/90 backdrop-blur">
            <CardHeader className="gap-3 pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Database className="size-3.5" />
                    Client-side viewer
                  </div>
                  <CardTitle className="text-xl md:text-2xl">DayZ Player DB Viewer</CardTitle>
                  <CardDescription className="max-w-2xl text-xs leading-5 md:text-sm">
                    Compact inventory browsing with player search, item search, and per-player summaries — all in the browser.
                  </CardDescription>
                </div>
                <Badge className="shrink-0" variant={statusTone}>
                  {statusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-3">
              <StatTile icon={Database} label="Records" value={viewState.players.length} />
              <StatTile icon={Package2} label="Alive" value={alivePlayers} />
              <StatTile icon={Package2} label="Dead" value={deadPlayers} />
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/90 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle>Database</CardTitle>
              <CardDescription>Pick a DayZ player database file to inspect locally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                ref={fileInputRef}
                className="hidden"
                id="database-file"
                type="file"
                accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3"
                onChange={handleDatabaseChange}
                disabled={isLoading}
              />
              <Button className="w-full justify-center" onClick={openFilePicker} disabled={isLoading}>
                <Upload className="size-3.5" />
                {isLoading ? 'Loading…' : 'Choose database'}
              </Button>
              <p className={cn('text-[11px] leading-5 text-muted-foreground', viewState.hasError && 'text-destructive')}>
                {viewState.statusMessage}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="border-border/80 bg-card/90 backdrop-blur">
            <CardHeader className="gap-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>Players</CardTitle>
                  <CardDescription>Steam64 when known from your searches, otherwise the stored DayZ UID.</CardDescription>
                </div>
                <Badge variant="outline">{viewState.filteredPlayers.length}</Badge>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Find UID / Steam64 / name"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={!viewState.fileLoaded}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              {viewState.filteredPlayers.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-4 text-xs text-muted-foreground">
                  {viewState.players.length === 0
                    ? 'Upload a database to load player records.'
                    : 'No players match the current search.'}
                </div>
              ) : (
                <ScrollArea className="h-[min(68vh,56rem)] pr-3" aria-live="polite">
                  <div className="space-y-2">
                    {viewState.filteredPlayers.map((player) => {
                      const parsedItems = countAllItems(player.items);

                      return (
                        <button
                          key={player.uid}
                          type="button"
                          className={cn(
                            'w-full rounded-lg border border-border/80 bg-background/55 px-3 py-2 text-left text-xs shadow-sm transition-colors hover:bg-accent/45',
                            player.uid === viewState.selectedUid && 'border-primary/70 bg-accent/45 ring-1 ring-primary/30'
                          )}
                          onClick={() => selectPlayer(player.uid)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {getPreferredPlayerIdLabel(player.uid)}
                            </span>
                            <Badge variant={player.alive ? 'secondary' : 'destructive'}>
                              {player.alive ? 'Alive' : 'Dead'}
                            </Badge>
                          </div>
                          <div className="mt-1 break-all font-mono text-[11px] leading-4 text-foreground">{getPreferredPlayerId(player.uid)}</div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Items</span>
                            <span className="font-semibold text-foreground">{parsedItems}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Blob</span>
                            <span className="font-semibold text-foreground">{player.hasData ? 'Yes' : 'Missing'}</span>
                          </div>
                          {player.characterName && (
                            <div className="mt-1 truncate text-[11px] text-muted-foreground">{player.characterName}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <Card className="border-border/80 bg-card/90 backdrop-blur">
              <CardHeader className="gap-2 pb-3">
                <CardTitle>Item search</CardTitle>
                <CardDescription>Search alive players by classname and jump straight to the matching inventory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search item classname"
                    value={itemSearchQuery}
                    onChange={(event) => setItemSearchQuery(event.target.value)}
                    disabled={!viewState.fileLoaded}
                    className="pl-8"
                  />
                </div>

                {itemSearchQuery.trim().length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-3 text-[11px] text-muted-foreground">
                    Type an item classname fragment to see which alive players carry it.
                  </div>
                ) : itemSearchResults.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-3 text-[11px] text-muted-foreground">
                    No matching items found.
                  </div>
                ) : (
                  <ScrollArea className="h-44 pr-3" aria-live="polite">
                    <div className="space-y-2">
                      {itemSearchResults.map((result) => (
                        <button
                          key={result.uid}
                          type="button"
                          className={cn(
                            'w-full rounded-lg border border-border/80 bg-background/55 px-3 py-2 text-left text-xs shadow-sm transition-colors hover:bg-accent/45',
                            result.uid === viewState.selectedUid && 'border-primary/70 bg-accent/45 ring-1 ring-primary/30'
                          )}
                          onClick={() => selectPlayer(result.uid)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="truncate text-xs font-semibold">
                              {result.characterName || 'Unnamed character'}
                            </strong>
                            <Badge variant="secondary">{result.count}</Badge>
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {getPreferredPlayerIdLabel(result.uid)} {getPreferredPlayerId(result.uid)}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">DB ID {result.id}</div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/90 backdrop-blur">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div className="space-y-1">
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>
                    {selectedPlayer
                      ? `${selectedPlayer.characterName || 'Unnamed character'} · ${totalSelectedItems} parsed item${totalSelectedItems === 1 ? '' : 's'}`
                      : 'Choose a player to inspect the inventory tree.'}
                  </CardDescription>
                </div>
                {selectedPlayer && (
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Switch checked={showItemMetadata} onCheckedChange={setShowItemMetadata} />
                      <span>Show item metadata</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Switch checked={showPlayerStats} onCheckedChange={setShowPlayerStats} />
                      <span>Show player stats</span>
                    </label>
                    <Button size="sm" variant="outline" onClick={() => setShowInventorySummary((current) => !current)}>
                      {showInventorySummary ? 'Hide summary' : 'Item summary'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedPlayer === null ? (
                  <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-6 text-center text-xs text-muted-foreground">
                    Choose a player to view the parsed inventory tree.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                      <DetailTile label="Name" value={selectedPlayer.characterName || 'Unnamed'} />
                      <DetailTile label="DB ID" value={selectedPlayer.id} mono />
                      <DetailTile label={selectedPlayerSteamId ? 'Steam64' : 'DayZ UID'} value={selectedPlayerSteamId ?? selectedPlayer.uid} mono />
                      {selectedPlayerSteamId && <DetailTile label="DayZ UID" value={selectedPlayer.uid} mono />}
                      <DetailTile label="Status" value={selectedPlayer.alive ? 'Alive' : 'Dead'} />
                      <DetailTile label="Blob" value={selectedPlayer.hasData ? 'Present' : 'Missing'} />
                      <DetailTile label="Top-level" value={selectedPlayer.items.length} mono />
                      <DetailTile label="Parsed total" value={totalSelectedItems} mono />
                    </div>

                    {!selectedPlayer.hasData && (
                      <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-3 text-[11px] text-muted-foreground">
                        This player row has no `Data` blob, so position, stats, and inventory content are unavailable.
                      </div>
                    )}

                    {showPlayerStats && (
                      <>
                        <div className="grid gap-2 xl:grid-cols-4">
                          <PanelCard title="Core stats" badge={selectedPlayerPrimaryStats.length}>
                            {selectedPlayerPrimaryStats.length === 0 ? (
                              <EmptyPanelCopy text="No parsed headline stats in this record." />
                            ) : (
                              <div className="space-y-2">
                                {selectedPlayerPrimaryStats.map((stat) => (
                                  <PanelRow key={stat.key} label={formatStatLabel(stat.key)} value={formatStatValue(stat.key, stat.value)} />
                                ))}
                              </div>
                            )}
                          </PanelCard>

                          <PanelCard title="Conditions" badge={selectedPlayerActiveConditions.length}>
                            {selectedPlayerActiveConditions.length === 0 ? (
                              <EmptyPanelCopy text="No active condition flags." className="text-emerald-300/90" />
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedPlayerActiveConditions.map((stat) => (
                                  <Badge key={stat.key} variant={getConditionVariant(stat.key)} className="normal-case tracking-normal">
                                    {formatStatLabel(stat.key)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </PanelCard>

                          <PanelCard title="Position" badge={selectedPlayer.position ? 'Header' : '—'}>
                            {selectedPlayer.position === null ? (
                              <EmptyPanelCopy text="No parsed position header in this record." />
                            ) : (
                              <div className="space-y-2">
                                <PanelRow label="X" value={formatCoordinate(selectedPlayer.position.x)} mono />
                                <PanelRow label="Y" value={formatCoordinate(selectedPlayer.position.y)} mono />
                                <PanelRow label="Z" value={formatCoordinate(selectedPlayer.position.z)} mono />
                                <PanelRow label="Facing (est.)" value={`${formatCoordinate(selectedPlayer.position.facingDegrees)}°`} mono />
                              </div>
                            )}
                          </PanelCard>

                          <PanelCard title="Meta" badge={selectedPlayer.blobVersion ?? '—'}>
                            <div className="space-y-2">
                              <PanelRow label="Blob version" value={selectedPlayer.blobVersion ?? '—'} mono />
                              <PanelRow label="Stat fields" value={selectedPlayer.stats.length} mono />
                              <PanelRow label="Blob bytes" value={selectedPlayerDataBytes} mono />
                              <PanelRow label="Character data" value={selectedPlayer.hasData ? 'Present' : 'Missing'} />
                            </div>
                          </PanelCard>
                        </div>

                        <details className="rounded-lg border border-border/80 bg-background/45 px-3 py-2 text-xs shadow-sm">
                          <summary className="cursor-pointer font-medium text-foreground marker:text-muted-foreground">
                            All parsed stats <span className="ml-1 text-muted-foreground">({selectedPlayerAllStats.length})</span>
                          </summary>
                          <div className="mt-2">
                            {selectedPlayerAllStats.length === 0 ? (
                              <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-3 text-[11px] text-muted-foreground">
                                No stat entries were parsed from this player record.
                              </div>
                            ) : (
                              <ScrollArea className="h-44 rounded-md border border-border/80 bg-background/35 p-2 pr-3">
                                <div className="space-y-1">
                                  {selectedPlayerAllStats.map((stat) => (
                                    <div
                                      key={stat.key}
                                      className="flex items-center justify-between gap-3 rounded-md bg-card/70 px-2.5 py-2 text-[11px]"
                                    >
                                      <span className="min-w-0 flex-1 text-muted-foreground">{formatStatLabel(stat.key)}</span>
                                      <span className="font-mono font-semibold text-foreground">{formatStatValue(stat.key, stat.value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </div>
                        </details>
                      </>
                    )}

                    {showInventorySummary && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Item summary
                          </div>
                          <Badge variant="outline">{selectedPlayerSummary.length}</Badge>
                        </div>
                        {selectedPlayerSummary.length === 0 ? (
                          <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-3 text-[11px] text-muted-foreground">
                            This player has no parsed inventory items.
                          </div>
                        ) : (
                          <ScrollArea className="h-44 rounded-md border border-border/80 bg-background/40 p-2 pr-3" aria-live="polite">
                            <div className="space-y-1">
                              {selectedPlayerSummary.map((item) => (
                                <div
                                  key={item.classname}
                                  className="flex items-center justify-between gap-3 rounded-md bg-card/70 px-2.5 py-2 text-xs"
                                >
                                  <span className="min-w-0 flex-1 text-muted-foreground wrap-break-word">{item.classname}</span>
                                  <span className="font-semibold text-foreground">{item.count}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Inventory tree
                        </div>
                        <Badge variant="outline">{selectedPlayer.items.length} top-level</Badge>
                      </div>
                      <ScrollArea className="h-[min(72vh,58rem)] rounded-md border border-border/80 bg-background/35 p-2 pr-3">
                        <InventoryTree items={selectedPlayer.items} showMetadata={showItemMetadata} />
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: number;
}

function StatTile({ icon: Icon, label, value }: StatTileProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/55 px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-3.5" />
      </div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

interface DetailTileProps {
  label: string;
  value: string | number;
  mono?: boolean;
}

function DetailTile({ label, value, mono = false }: DetailTileProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/55 px-3 py-2 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={cn('mt-1 break-all text-xs font-semibold text-foreground', mono && 'font-mono')}>{value}</div>
    </div>
  );
}

interface PanelCardProps {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}

function PanelCard({ title, badge, children }: PanelCardProps) {
  return (
    <section className="rounded-lg border border-border/80 bg-background/45 px-3 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
        {badge !== undefined && <Badge variant="outline">{badge}</Badge>}
      </div>
      {children}
    </section>
  );
}

interface PanelRowProps {
  label: string;
  value: string | number;
  mono?: boolean;
}

function PanelRow({ label, value, mono = false }: PanelRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right font-semibold text-foreground', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

interface EmptyPanelCopyProps {
  text: string;
  className?: string;
}

function EmptyPanelCopy({ text, className }: EmptyPanelCopyProps) {
  return (
    <div className={cn(
      'flex min-h-28 items-center justify-center rounded-md border border-dashed border-border/70 bg-background/35 px-3 text-center text-[11px] text-muted-foreground',
      className
    )}>
      {text}
    </div>
  );
}

function getPrimaryStatEntries(player: PlayerRecord | null): PlayerStatEntry[] {
  if (player === null) {
    return [];
  }

  const statsByKey = new Map(player.stats.map((stat) => [stat.key, stat]));

  return primaryStatKeys.flatMap((key) => {
    const stat = statsByKey.get(key);
    return stat ? [stat] : [];
  });
}

function getActiveConditionEntries(player: PlayerRecord | null): PlayerStatEntry[] {
  if (player === null) {
    return [];
  }

  return player.stats
    .filter((stat) => stat.key.startsWith('mdf_') && stat.key.endsWith('_state') && stat.value > 0)
    .sort((left, right) => formatStatLabel(left.key).localeCompare(formatStatLabel(right.key)));
}

function getSortedStatEntries(player: PlayerRecord | null): PlayerStatEntry[] {
  if (player === null) {
    return [];
  }

  return [...player.stats].sort((left, right) => formatStatLabel(left.key).localeCompare(formatStatLabel(right.key)));
}

function formatStatLabel(key: string): string {
  return statLabelMap[key] ?? humanizeStatKey(key);
}

function humanizeStatKey(key: string): string {
  const normalized = key.replace(/^mdf_/, '').replace(/_state$/, '').replace(/_/g, ' ').trim();

  if (!normalized) {
    return key;
  }

  return normalized
    .split(/\s+/)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function formatStatValue(key: string, value: number): string {
  if (key === 'infected_killed' || key === 'players_killed') {
    return formatNumber(value, 0);
  }

  return formatNumber(value, Math.abs(value - Math.round(value)) > 0.05 ? 1 : 0);
}

function formatCoordinate(value: number): string {
  return formatNumber(value, 1);
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function getConditionVariant(key: string): 'secondary' | 'destructive' | 'outline' {
  if (beneficialConditionKeys.has(key)) {
    return 'secondary';
  }

  return 'destructive';
}

export default App;

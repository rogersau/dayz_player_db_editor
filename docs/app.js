(function () {
    const databaseFileInput = document.getElementById("database-file");
    const playerSearchInput = document.getElementById("player-search");
    const playersList = document.getElementById("players-list");
    const playersEmpty = document.getElementById("players-empty");
    const detailsEmpty = document.getElementById("details-empty");
    const playerDetails = document.getElementById("player-details");
    const inventoryTree = document.getElementById("inventory-tree");
    const inventorySummary = document.getElementById("inventory-summary");
    const statusMessage = document.getElementById("status-message");
    const playerCount = document.getElementById("player-count");
    const aliveCount = document.getElementById("alive-count");
    const deadCount = document.getElementById("dead-count");

    const detailId = document.getElementById("detail-id");
    const detailUid = document.getElementById("detail-uid");
    const detailName = document.getElementById("detail-name");
    const detailStatus = document.getElementById("detail-status");
    const detailItemCount = document.getElementById("detail-item-count");

    const textDecoder = new TextDecoder();
    const state = {
        players: [],
        filteredPlayers: [],
        selectedUid: null,
        sqlModule: null
    };

    databaseFileInput.addEventListener("change", async (event) => {
        const [file] = event.target.files ?? [];

        if (!file) {
            return;
        }

        await loadDatabase(file);
    });

    playerSearchInput.addEventListener("input", async () => {
        await filterPlayers(playerSearchInput.value);
    });

    async function loadDatabase(file) {
        resetView();
        setStatus(`Loading ${file.name}...`);

        try {
            const sqlModule = await getSqlModule();
            const fileBytes = new Uint8Array(await file.arrayBuffer());
            const database = new sqlModule.Database(fileBytes);
            const players = readPlayers(database);
            database.close();

            state.players = players;
            state.selectedUid = players[0]?.uid ?? null;
            playerSearchInput.disabled = false;
            playerSearchInput.value = "";

            await filterPlayers("");
            setStatus(`Loaded ${players.length} player record${players.length === 1 ? "" : "s"} from ${file.name}.`);
        } catch (error) {
            console.error(error);
            state.players = [];
            state.filteredPlayers = [];
            state.selectedUid = null;
            playerSearchInput.disabled = true;
            renderPlayers();
            renderSelectedPlayer();
            setStatus(error instanceof Error ? error.message : "Failed to load the database.", true);
        }
    }

    async function filterPlayers(query) {
        const normalizedQuery = query.trim().toLowerCase();
        const convertedUid = query.trim().length === 17 ? await steamIdToUid(query.trim()) : null;

        state.filteredPlayers = state.players.filter((player) => {
            if (!normalizedQuery) {
                return true;
            }

            return player.uid.toLowerCase().includes(normalizedQuery)
                || (convertedUid !== null && player.uid === convertedUid)
                || (player.characterName ?? "").toLowerCase().includes(normalizedQuery);
        });

        if (!state.filteredPlayers.some((player) => player.uid === state.selectedUid)) {
            state.selectedUid = state.filteredPlayers[0]?.uid ?? null;
        }

        renderPlayers();
        renderSelectedPlayer();
    }

    function resetView() {
        state.players = [];
        state.filteredPlayers = [];
        state.selectedUid = null;
        playerCount.textContent = "0";
        aliveCount.textContent = "0";
        deadCount.textContent = "0";
        playersList.replaceChildren();
        inventoryTree.replaceChildren();
        playerDetails.classList.add("hidden");
        detailsEmpty.classList.remove("hidden");
        playersEmpty.classList.remove("hidden");
        statusMessage.classList.remove("error");
    }

    function renderPlayers() {
        playersList.replaceChildren();
        const alivePlayers = state.players.filter((player) => player.alive).length;

        playerCount.textContent = String(state.players.length);
        aliveCount.textContent = String(alivePlayers);
        deadCount.textContent = String(state.players.length - alivePlayers);

        if (state.filteredPlayers.length === 0) {
            playersEmpty.textContent = state.players.length === 0
                ? "Upload a database to load player records."
                : "No players match the current search.";
            playersEmpty.classList.remove("hidden");
            return;
        }

        playersEmpty.classList.add("hidden");

        for (const player of state.filteredPlayers) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `player-card${player.uid === state.selectedUid ? " active" : ""}`;
            button.addEventListener("click", () => {
                state.selectedUid = player.uid;
                renderPlayers();
                renderSelectedPlayer();
            });

            const header = document.createElement("div");
            header.className = "player-card-header";

            const uid = document.createElement("strong");
            uid.textContent = player.uid;

            const status = document.createElement("span");
            status.className = `status-pill${player.alive ? "" : " dead"}`;
            status.textContent = player.alive ? "Alive" : "Dead";

            header.append(uid, status);

            const meta = document.createElement("div");
            meta.className = "player-meta";
            meta.textContent = `DB ID ${player.id} • ${countAllItems(player.items)} parsed item${countAllItems(player.items) === 1 ? "" : "s"}`;

            const name = document.createElement("div");
            name.className = "player-name";
            name.textContent = player.characterName || "Unnamed character";

            button.append(header, meta, name);
            playersList.append(button);
        }
    }

    function renderSelectedPlayer() {
        const player = state.filteredPlayers.find((entry) => entry.uid === state.selectedUid) ?? null;

        inventoryTree.replaceChildren();

        if (player === null) {
            playerDetails.classList.add("hidden");
            detailsEmpty.classList.remove("hidden");
            return;
        }

        detailsEmpty.classList.add("hidden");
        playerDetails.classList.remove("hidden");

        detailId.textContent = String(player.id);
        detailUid.textContent = player.uid;
        detailName.textContent = player.characterName || "Unnamed character";
        detailStatus.textContent = player.alive ? "Alive" : "Dead";
        detailItemCount.textContent = String(player.items.length);

        const totalItems = countAllItems(player.items);
        inventorySummary.textContent = `${totalItems} parsed item${totalItems === 1 ? "" : "s"} (${player.items.length} top-level)`;

        if (player.items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-list";
            empty.textContent = "This player has no parsed inventory items.";
            inventoryTree.append(empty);
            return;
        }

        for (const item of player.items) {
            inventoryTree.append(createItemNode(item, true));
        }
    }

    function createItemNode(item, expanded) {
        const wrapper = document.createElement("details");
        wrapper.className = "tree-node";
        wrapper.open = expanded;

        const summary = document.createElement("summary");
        summary.textContent = item.classname;

        const metadata = document.createElement("div");
        metadata.className = "item-meta";
        metadata.append(
            createMetadataLine("Slot", item.slot || "—"),
            createMetadataLine("PersistentID", item.persistentGuid),
            createMetadataLine("Owner UID", item.parent)
        );

        wrapper.append(summary, metadata);

        if (item.children.length > 0) {
            const childrenContainer = document.createElement("div");
            childrenContainer.className = "tree-children";

            const cargoChildren = item.children.filter((child) => child.slot === "cargo");
            const attachmentChildren = item.children.filter((child) => child.slot !== "cargo");

            if (cargoChildren.length > 0) {
                childrenContainer.append(createSectionNode("Cargo", cargoChildren));
            }

            if (attachmentChildren.length > 0) {
                childrenContainer.append(createSectionNode("Attachments", attachmentChildren));
            }

            wrapper.append(childrenContainer);
        }

        return wrapper;
    }

    function createSectionNode(title, items) {
        const section = document.createElement("details");
        section.className = "tree-node";
        section.open = true;

        const summary = document.createElement("summary");
        summary.textContent = title;
        section.append(summary);

        const childrenContainer = document.createElement("div");
        childrenContainer.className = "tree-children";

        for (const item of items) {
            childrenContainer.append(createItemNode(item, false));
        }

        section.append(childrenContainer);
        return section;
    }

    function createMetadataLine(label, value) {
        const line = document.createElement("div");
        line.textContent = `${label}: ${value}`;
        return line;
    }

    function readPlayers(database) {
        const result = database.exec("SELECT ID, UID, Alive, Data FROM Players ORDER BY UID ASC");

        if (result.length === 0) {
            return [];
        }

        return result[0].values.map(([id, uid, alive, data]) => parsePlayerRecord({
            id: Number(id),
            uid: typeof uid === "string" ? uid : "",
            alive: Boolean(alive),
            data: toUint8Array(data)
        }));
    }

    function parsePlayerRecord(record) {
        if (record.data.length === 0) {
            return {
                ...record,
                characterName: null,
                items: []
            };
        }

        const reader = createReader(record.data);

        reader.readBytes(16);
        const characterName = reader.readString(reader.readUint8()) || null;
        reader.readBytes(reader.readUint16());
        reader.readUint16();

        const topLevelItemCount = reader.readUint32();
        const items = [];

        for (let index = 0; index < topLevelItemCount; index += 1) {
            items.push(parseItem(reader, record.uid));
        }

        return {
            ...record,
            characterName,
            items
        };
    }

    function parseItem(reader, ownerUid) {
        reader.readUint32();
        const classname = reader.readString(reader.readUint8());
        reader.readBytes(6);
        const slot = reader.readString(reader.readUint8());
        const customDataLength = reader.readInt32();
        const guidBytes = reader.readBytes(16);
        const payloadLength = Math.max(customDataLength - 16, 0);
        reader.readBytes(payloadLength);

        const childrenCount = reader.readUint32();
        const children = [];

        for (let index = 0; index < childrenCount; index += 1) {
            children.push(parseItem(reader, ownerUid));
        }

        return {
            classname,
            slot,
            parent: ownerUid,
            persistentGuid: dotnetGuidFromBytes(guidBytes),
            children
        };
    }

    function countAllItems(items) {
        return items.reduce((total, item) => total + 1 + countAllItems(item.children), 0);
    }

    function createReader(bytes) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let offset = 0;

        function ensureReadable(length) {
            if (offset + length > bytes.length) {
                throw new Error("The uploaded file contains a player record with unexpected binary data.");
            }
        }

        return {
            readBytes(length) {
                ensureReadable(length);
                const chunk = bytes.slice(offset, offset + length);
                offset += length;
                return chunk;
            },
            readUint8() {
                ensureReadable(1);
                const value = view.getUint8(offset);
                offset += 1;
                return value;
            },
            readUint16() {
                ensureReadable(2);
                const value = view.getUint16(offset, true);
                offset += 2;
                return value;
            },
            readUint32() {
                ensureReadable(4);
                const value = view.getUint32(offset, true);
                offset += 4;
                return value;
            },
            readInt32() {
                ensureReadable(4);
                const value = view.getInt32(offset, true);
                offset += 4;
                return value;
            },
            readString(length) {
                return textDecoder.decode(this.readBytes(length));
            }
        };
    }

    function dotnetGuidFromBytes(bytes) {
        const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));

        return [
            hex.slice(3, 4).concat(hex.slice(2, 3), hex.slice(1, 2), hex.slice(0, 1)).join(""),
            hex.slice(5, 6).concat(hex.slice(4, 5)).join(""),
            hex.slice(7, 8).concat(hex.slice(6, 7)).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10, 16).join("")
        ].join("-").toUpperCase();
    }

    function toUint8Array(value) {
        if (value == null) {
            return new Uint8Array();
        }

        if (value instanceof Uint8Array) {
            return value;
        }

        if (Array.isArray(value)) {
            return Uint8Array.from(value);
        }

        if (value.buffer instanceof ArrayBuffer) {
            return new Uint8Array(value.buffer);
        }

        throw new Error("The uploaded file does not contain player data in the expected format.");
    }

    async function steamIdToUid(steamId) {
        if (!/^\d{17}$/.test(steamId)) {
            return null;
        }

        const bytes = new TextEncoder().encode(steamId);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        return toBase64(new Uint8Array(digest)).replaceAll("/", "_").replaceAll("+", "-");
    }

    function toBase64(bytes) {
        let binary = "";

        for (const value of bytes) {
            binary += String.fromCharCode(value);
        }

        return btoa(binary);
    }

    async function getSqlModule() {
        if (state.sqlModule !== null) {
            return state.sqlModule;
        }

        state.sqlModule = await window.initSqlJs();

        return state.sqlModule;
    }

    function setStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.classList.toggle("error", isError);
    }
}());

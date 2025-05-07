namespace DZ_Players;

public partial class PlayerEditor : UserControl
{
    private DzPlayersDb? DB;
    public PlayerEditor()
    {
        InitializeComponent();
    }
    public void LoadPlayerDB(string path)
    {
        DB = new DzPlayersDb(path);
        playerCounter.Text = $"Records: {DB.Players.Count}";
        LoadPlayersList();
    }
    public void ReloadDB(string path)
    {
        ResetDB();
        ResetControls();
        LoadPlayerDB(path);
    }

    private void ResetDB() => DB = null;

    private void ResetControls()
    {
        playerCounter.Text = "Records: 0";

        playersListBox.Items.Clear();
        playerInventory.Nodes.Clear();
        dupeInventory.Nodes.Clear();

        playerDbId.Clear();
        playerUID.Clear();
        playerChartype.Clear();
        playerStatus.Text = "Missing";
    }
    private void LoadPlayersList()
    {
        playersListBox.BeginUpdate();

        if (DB != null)
        {
            foreach (var player in DB.Players)
                playersListBox.Items.Add(player);
            
            playersListBox.DisplayMember = "UID";
            
            if (playersListBox.Items.Count > 0)
                playersListBox.SelectedIndex = 0;
        }
        
        playersListBox.EndUpdate();
    }

    private void Click_Button_Action(object sender, EventArgs e)
    {
        if (DB == null)
            return;
        if (sender == searchPlayerButton)
            FindNextPlayer();
        else if (sender == searchDuplicatesButton)
            SearchDuplicates();
        else if (sender == clearDuplicatesListButton)
            dupeInventory.Nodes.Clear();
        else if (sender == countItemsButton)
            CountPlayerItems();
        else if (sender == searchItemButton)
            SearchItemAcrossPlayers();
    }
    private void FindNextPlayer()
    {
        if (string.IsNullOrWhiteSpace(searchPlayer.Text))
            return;
        var uid = searchPlayer.Text;

        if (searchPlayer.Text.Length == 17)
            uid = Utils.SteamIDToUID(uid);

        foreach (DzChar item in playersListBox.Items)
        {
            if (item.UID != uid)
                continue;
            playersListBox.SelectedItem = item;
            return;
        }
    }
    private void SearchDuplicates()
    {
        var allItemsList = new Dictionary<string, List<DzItem>>();
        var parentWithDupedItems = new Dictionary<string, List<DzItem>>();

        var playerNode = new TreeNode("Players");
        var itemsNode = new TreeNode("Items");

        if (DB != null)
        {
            foreach (var player in DB.Players)
            {
                if (player.Items == null || !player.Alive)
                    continue;
                foreach (var item in player.Items)
                {
                    if (!allItemsList.ContainsKey(item.PersistentGuid))
                        allItemsList.Add(item.PersistentGuid, new List<DzItem>());
                    allItemsList[item.PersistentGuid].Add(item);
                }
            }
        }

        foreach (var pairItem in allItemsList)
        {
            if (pairItem.Value.Count <= 1)
                continue;
            var itemNode = new TreeNode(pairItem.Key) { Tag = "GUID:" + pairItem.Key };
            foreach (var item in pairItem.Value)
            {
                if (!parentWithDupedItems.ContainsKey(item.Parent))
                    parentWithDupedItems.Add(item.Parent, new List<DzItem>());

                parentWithDupedItems[item.Parent].Add(item);
                itemNode.Nodes.Add(ParseItem(item));
            }
            itemsNode.Nodes.Add(itemNode);
        }

        var sortDict = parentWithDupedItems
            .OrderByDescending(kvp => kvp.Value.Count)
            .ToList();

        dupeInventory.BeginUpdate();
        dupeInventory.Nodes.Clear();


        foreach (var pair in sortDict)
        {
            var player = new TreeNode($"Count: {pair.Value.Count} {pair.Key}") { Tag = "PUID:" + pair.Key };

            foreach (var item in pair.Value)
                player.Nodes.Add(ParseItem(item));
            playerNode.Nodes.Add(player);
        }

        dupeInventory.Nodes.Add(playerNode);
        dupeInventory.Nodes.Add(itemsNode);

        dupeInventory.EndUpdate();

    }
    private void SelectNextPlayer(object sender, EventArgs e)
    {
        if (playersListBox.SelectedIndex == -1)
            return;

        if (playersListBox.SelectedItem is not DzChar player)
            return;

        playerDbId.Text = player.ID.ToString();
        playerUID.Text = player.UID;
        playerChartype.Text = player.CharacterName;
        playerStatus.Text = player.Alive ? "Alive" : "Dead";

        ParseInventory(player);
    }
    private void ParseInventory(DzChar? player)
    {
        if (player?.Items == null)
            return;

        playerInventory.BeginUpdate();
        playerInventory.Nodes.Clear();

        foreach (var item in player.Items)
            playerInventory.Nodes.Add(ParseItem(item));

        playerInventory.EndUpdate();
    }
    private static TreeNode ParseItem(DzItem item)
    {
        var itemNode = new TreeNode(item.Classname) { Tag = item };

        itemNode.Nodes.Add(new TreeNode($"Slot: {item.Slot}"));
        itemNode.Nodes.Add(new TreeNode($"PersistentID: {item.PersistentGuid}") { Tag = "GUID:" + item.PersistentGuid });
        itemNode.Nodes.Add(new TreeNode($"ParentUID: {item.Parent}") { Tag = "PUID:" + item.Parent }) ;

        var cargo = new TreeNode("Cargo");
        var attachments = new TreeNode("Attachments");

        if (item.Childs == null)
            return itemNode;
        foreach (var child in item.Childs)
        {
            var childNode = ParseItem(child);

            if (child.Slot == "cargo")
                cargo.Nodes.Add(childNode);
            else
                attachments.Nodes.Add(childNode);
        }

        if (cargo.Nodes.Count > 0)
            itemNode.Nodes.Add(cargo);
        if (attachments.Nodes.Count > 0)
            itemNode.Nodes.Add(attachments);

        return itemNode;
    }

    private void NodeMouseClick(object sender, TreeNodeMouseClickEventArgs e)
    {
        if (e.Button != MouseButtons.Right)
            return;
        var treeView = (TreeView)sender;
        if (e.Node.Tag is not string)
            return;

        copyAsIntArrayMenuItem1.Visible = false;
        copyParentUIDMenuItem.Visible = false;

        string node_tag = (string)e.Node.Tag;

        if (node_tag.Contains("GUID:"))
            copyAsIntArrayMenuItem1.Visible = true;
        else if (node_tag.Contains("PUID:"))
            copyParentUIDMenuItem.Visible = true;

        treeView.SelectedNode = e.Node;
        contextMenuStrip1.Show(treeView, e.Location);
    }

    private void copyAsIntArrayMenuItem1_Click(object sender, EventArgs e)
    {
        var node = (((TreeView)(((ContextMenuStrip)((ToolStripMenuItem)sender).Owner!)!).SourceControl!)!).SelectedNode;
        var bytes = Guid.Parse(((string)node.Tag).Remove(0, 5)).ToByteArray();
        var persistArray = new int[4];
        for (var i = 0; i < 4; i++)
            persistArray[i] = BitConverter.ToInt32(bytes, i * 4);
        Clipboard.SetText(string.Join(',', persistArray.Select(x => x.ToString()).ToArray()));
    }

    private void copyParentUIDMenuItem_Click(object sender, EventArgs e)
    {
        var node = (((TreeView)(((ContextMenuStrip)((ToolStripMenuItem)sender).Owner!)!).SourceControl!)!).SelectedNode;
        Clipboard.SetText(((string)node.Tag).Remove(0,5));
    }

    private void CountPlayerItems()
    {
        if (playersListBox.SelectedItem is not DzChar player || player.Items == null)
        {
            MessageBox.Show("No player selected or player has no items.", "Count Items", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        // Dictionary to store item counts by classname
        var itemCounts = new Dictionary<string, int>();
        int totalItems = 0;

        // Recursive function to count all items including those in containers
        void CountItemsRecursive(DzItem item)
        {
            // Count the item itself
            if (itemCounts.ContainsKey(item.Classname))
                itemCounts[item.Classname]++;
            else
                itemCounts[item.Classname] = 1;
            
            totalItems++;

            // Count child items
            if (item.Childs != null)
            {
                foreach (var childItem in item.Childs)
                {
                    CountItemsRecursive(childItem);
                }
            }
        }

        // Process all player's items
        foreach (var item in player.Items)
        {
            CountItemsRecursive(item);
        }

        // Format the results to display
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"Player: {player.CharacterName} (UID: {player.UID})");
        sb.AppendLine($"Total items: {totalItems}");
        sb.AppendLine();
        sb.AppendLine("Item counts by name:");
        sb.AppendLine("---------------------");

        // Order items by count (descending)
        foreach (var item in itemCounts.OrderByDescending(i => i.Value))
        {
            sb.AppendLine($"{item.Key}: {item.Value}");
        }

        // Display the results in a dialog
        var resultsForm = new Form
        {
            Text = "Item Count Results",
            Size = new Size(500, 600),
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.Sizable,
            MinimizeBox = false,
            MaximizeBox = true
        };

        var textBox = new TextBox
        {
            Multiline = true,
            ReadOnly = true,
            Dock = DockStyle.Fill,
            ScrollBars = ScrollBars.Both,
            Text = sb.ToString(),
            Font = new Font("Consolas", 10)
        };

        var closeButton = new Button
        {
            Text = "Close",
            Dock = DockStyle.Bottom,
            Height = 30
        };
        closeButton.Click += (s, e) => resultsForm.Close();

        resultsForm.Controls.Add(textBox);
        resultsForm.Controls.Add(closeButton);
        resultsForm.Show();
    }

    private void SearchItemAcrossPlayers()
    {
        if (string.IsNullOrWhiteSpace(searchItemTextBox.Text) || DB == null)
        {
            MessageBox.Show("Please enter an item name to search for.", "Search Item", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        string searchTerm = searchItemTextBox.Text.Trim().ToLowerInvariant();
        
        // Dictionary to store player counts for the searched item
        var playerItemCounts = new Dictionary<string, int>();
        int totalItemsFound = 0;
        int playersWithItem = 0;

        // Recursive function to count matching items including those in containers
        void CountItemsRecursive(DzItem item, string playerUID)
        {
            // Check if the item name contains the search term
            if (item.Classname.ToLowerInvariant().Contains(searchTerm))
            {
                if (!playerItemCounts.ContainsKey(playerUID))
                    playerItemCounts[playerUID] = 0;
                
                playerItemCounts[playerUID]++;
                totalItemsFound++;
            }

            // Search in child items
            if (item.Childs != null)
            {
                foreach (var childItem in item.Childs)
                {
                    CountItemsRecursive(childItem, playerUID);
                }
            }
        }

        // Process all players' items
        foreach (var player in DB.Players)
        {
            if (player.Items == null || !player.Alive)
                continue;
            
            foreach (var item in player.Items)
            {
                CountItemsRecursive(item, player.UID);
            }
            
            // Track how many players have this item
            if (playerItemCounts.ContainsKey(player.UID) && playerItemCounts[player.UID] > 0)
                playersWithItem++;
        }

        // Format the results to display
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"Search Results for: \"{searchItemTextBox.Text}\"");
        sb.AppendLine($"Total items found: {totalItemsFound} in {playersWithItem} players");
        sb.AppendLine();
        sb.AppendLine("Item counts by player:");
        sb.AppendLine("-----------------------");

        // Show players with the item, ordered by count (descending)
        foreach (var playerCount in playerItemCounts.OrderByDescending(p => p.Value))
        {
            // Find player name for this UID
            string playerName = "Unknown";
            foreach (var player in DB.Players)
            {
                if (player.UID == playerCount.Key)
                {
                    playerName = player.CharacterName;
                    break;
                }
            }
            
            sb.AppendLine($"{playerName} (UID: {playerCount.Key}): {playerCount.Value}");
        }

        // If no results, show message
        if (totalItemsFound == 0)
        {
            sb.AppendLine("No matching items found.");
        }

        // Display the results in a dialog
        var resultsForm = new Form
        {
            Text = "Item Search Results",
            Size = new Size(600, 600),
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.Sizable,
            MinimizeBox = false,
            MaximizeBox = true
        };

        var textBox = new TextBox
        {
            Multiline = true,
            ReadOnly = true,
            Dock = DockStyle.Fill,
            ScrollBars = ScrollBars.Both,
            Text = sb.ToString(),
            Font = new Font("Consolas", 10)
        };

        var closeButton = new Button
        {
            Text = "Close",
            Dock = DockStyle.Bottom,
            Height = 30
        };
        closeButton.Click += (s, e) => resultsForm.Close();

        var selectPlayerButton = new Button
        {
            Text = "Select Player",
            Dock = DockStyle.Bottom,
            Height = 30,
            Enabled = false
        };
        
        // Use MouseUp and TextChanged instead of SelectionChanged
        textBox.MouseUp += UpdateSelectButtonState;
        textBox.TextChanged += UpdateSelectButtonState;
        
        // Helper method to update button state
        void UpdateSelectButtonState(object? sender, EventArgs e)
        {
            // Look for a UID pattern in the selected text
            string selectedText = textBox.SelectedText;
            selectPlayerButton.Enabled = selectedText.Contains("UID:") && selectedText.Length > 5;
        }

        // Try to select the player when the button is clicked
        selectPlayerButton.Click += (s, e) => {
            string selectedText = textBox.SelectedText;
            if (selectedText.Contains("UID:"))
            {
                int startIndex = selectedText.IndexOf("UID:") + 5;
                int endIndex = selectedText.IndexOf(")", startIndex);
                if (endIndex > startIndex)
                {
                    string uid = selectedText.Substring(startIndex, endIndex - startIndex).Trim();
                    searchPlayer.Text = uid;
                    FindNextPlayer();
                    resultsForm.Close();
                }
            }
        };

        resultsForm.Controls.Add(textBox);
        resultsForm.Controls.Add(selectPlayerButton);
        resultsForm.Controls.Add(closeButton);
        resultsForm.Show();
    }
}

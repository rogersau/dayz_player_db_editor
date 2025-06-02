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
        else if (sender == comparePlayersButton)
            ComparePlayerInventories();
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

    private void ComparePlayerInventories()
    {
        if (DB == null || DB.Players.Count < 2)
        {
            MessageBox.Show("Need at least two players in the database to compare.", 
                "Compare Players", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        // Create a player selection form
        var selectionForm = new Form
        {
            Text = "Select Players to Compare",
            Size = new Size(400, 300),
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MinimizeBox = false,
            MaximizeBox = false,
            ShowInTaskbar = false
        };

        // First player selection
        var firstPlayerLabel = new Label
        {
            Text = "First Player:",
            Location = new Point(20, 20),
            AutoSize = true
        };

        // ComboBox with UID-based filtering
        var firstPlayerCombo = new ComboBox
        {
            Location = new Point(20, 45),
            Width = 340,
            AutoCompleteMode = AutoCompleteMode.SuggestAppend,
            AutoCompleteSource = AutoCompleteSource.CustomSource
        };

        // Create an AutoCompleteStringCollection for the UID search
        var firstPlayerAutoComplete = new AutoCompleteStringCollection();

        // Second player selection
        var secondPlayerLabel = new Label
        {
            Text = "Second Player:",
            Location = new Point(20, 80),
            AutoSize = true
        };

        // ComboBox with UID-based filtering
        var secondPlayerCombo = new ComboBox
        {
            Location = new Point(20, 105),
            Width = 340,
            AutoCompleteMode = AutoCompleteMode.SuggestAppend,
            AutoCompleteSource = AutoCompleteSource.CustomSource
        };

        // Create an AutoCompleteStringCollection for the UID search
        var secondPlayerAutoComplete = new AutoCompleteStringCollection();

        // Dictionary to map display strings to player objects for easy lookup
        var playerDisplayMap = new Dictionary<string, DzChar>();
        var playerUidMap = new Dictionary<string, string>(); // Maps UID to display name

        // Populate player combo boxes
        foreach (var player in DB.Players.Where(p => p.Items != null))
        {
            // Format: "Name (UID: 123456789)"
            string displayName = $"{player.CharacterName} (UID: {player.UID})";
            playerDisplayMap[displayName] = player;
            playerUidMap[player.UID] = displayName;
            
            // Add to dropdown lists
            firstPlayerCombo.Items.Add(displayName);
            secondPlayerCombo.Items.Add(displayName);
            
            // Add the UID to the autocomplete collections
            firstPlayerAutoComplete.Add(player.UID);
            secondPlayerAutoComplete.Add(player.UID);
        }
        
        // Set the autocomplete custom sources
        firstPlayerCombo.AutoCompleteCustomSource = firstPlayerAutoComplete;
        secondPlayerCombo.AutoCompleteCustomSource = secondPlayerAutoComplete;
        
        // Add TextChanged handler to handle UID-based selection
        firstPlayerCombo.TextChanged += (s, e) => {
            string enteredText = firstPlayerCombo.Text.Trim();
            if (playerUidMap.TryGetValue(enteredText, out string? matchedDisplay))
            {
                // If exact UID match, select the item
                firstPlayerCombo.Text = matchedDisplay;
                firstPlayerCombo.Select(matchedDisplay.Length, 0); // Move cursor to end
            }
        };
        
        secondPlayerCombo.TextChanged += (s, e) => {
            string enteredText = secondPlayerCombo.Text.Trim();
            if (playerUidMap.TryGetValue(enteredText, out string? matchedDisplay))
            {
                // If exact UID match, select the item
                secondPlayerCombo.Text = matchedDisplay;
                secondPlayerCombo.Select(matchedDisplay.Length, 0); // Move cursor to end
            }
        };
        
        if (firstPlayerCombo.Items.Count > 0)
            firstPlayerCombo.SelectedIndex = 0;
        if (secondPlayerCombo.Items.Count > 1)
            secondPlayerCombo.SelectedIndex = 1;

        // Compare button
        var compareButton = new Button
        {
            Text = "Compare",
            Location = new Point(120, 200),
            Width = 80,
            Height = 30
        };

        var cancelButton = new Button
        {
            Text = "Cancel",
            Location = new Point(210, 200), 
            Width = 80,
            Height = 30
        };

        cancelButton.Click += (s, e) => selectionForm.Close();
        compareButton.Click += (s, e) =>
        {
            if (firstPlayerCombo.SelectedItem == null || secondPlayerCombo.SelectedItem == null)
            {
                MessageBox.Show("Please select two players to compare.", 
                    "Compare Players", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var player1DisplayName = firstPlayerCombo.SelectedItem.ToString();
            var player2DisplayName = secondPlayerCombo.SelectedItem.ToString();
            
            if (player1DisplayName == null || player2DisplayName == null || 
                !playerDisplayMap.TryGetValue(player1DisplayName, out var player1) || 
                !playerDisplayMap.TryGetValue(player2DisplayName, out var player2))
            {
                MessageBox.Show("Invalid player selection.", 
                    "Compare Players", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (player1.UID == player2.UID)
            {
                MessageBox.Show("Please select two different players.", 
                    "Compare Players", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            PerformInventoryComparison(player1, player2);
            selectionForm.Close();
        };

        // Help text
        var helpLabel = new Label
        {
            Text = "Type a player's UID to search",
            Location = new Point(20, 150),
            AutoSize = true,
            ForeColor = Color.Gray
        };

        // Add controls to form
        selectionForm.Controls.Add(firstPlayerLabel);
        selectionForm.Controls.Add(firstPlayerCombo);
        selectionForm.Controls.Add(secondPlayerLabel);
        selectionForm.Controls.Add(secondPlayerCombo);
        selectionForm.Controls.Add(helpLabel);
        selectionForm.Controls.Add(compareButton);
        selectionForm.Controls.Add(cancelButton);

        selectionForm.ShowDialog();
    }

    private void PerformInventoryComparison(DzChar player1, DzChar player2)
    {
        // Dictionaries to store items by their persistent UID
        var player1Items = new Dictionary<string, DzItem>();
        var player2Items = new Dictionary<string, DzItem>();
        var matchingItems = new Dictionary<string, (DzItem Item1, DzItem Item2)>();
        
        // Helper method to recursively extract all items with their persistent UIDs
        void ExtractItems(DzItem item, Dictionary<string, DzItem> itemsDict)
        {
            if (!string.IsNullOrEmpty(item.PersistentGuid))
                itemsDict[item.PersistentGuid] = item;
                
            if (item.Childs != null)
            {
                foreach (var child in item.Childs)
                    ExtractItems(child, itemsDict);
            }
        }
        
        // Build dictionaries for both players
        if (player1.Items != null)
        {
            foreach (var item in player1.Items)
                ExtractItems(item, player1Items);
        }
        
        if (player2.Items != null)
        {
            foreach (var item in player2.Items)
                ExtractItems(item, player2Items);
        }
        
        // Find matching items (same persistent UID)
        foreach (var kvp in player1Items)
        {
            string persistentUid = kvp.Key;
            if (player2Items.TryGetValue(persistentUid, out var player2Item))
            {
                matchingItems[persistentUid] = (kvp.Value, player2Item);
            }
        }
        
        // Display results
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"Inventory Comparison");
        sb.AppendLine($"Player 1: {player1.CharacterName} (UID: {player1.UID})");
        sb.AppendLine($"Player 2: {player2.CharacterName} (UID: {player2.UID})");
        sb.AppendLine();
        
        if (matchingItems.Count == 0)
        {
            sb.AppendLine("No matching persistent UIDs found between these players.");
        }
        else
        {
            sb.AppendLine($"Found {matchingItems.Count} items with matching persistent UIDs:");
            sb.AppendLine("----------------------------------------------------");
            
            foreach (var match in matchingItems)
            {
                sb.AppendLine($"Persistent UID: {match.Key}");
                sb.AppendLine($"Item 1: {match.Value.Item1.Classname} (Slot: {match.Value.Item1.Slot})");
                sb.AppendLine($"Item 2: {match.Value.Item2.Classname} (Slot: {match.Value.Item2.Slot})");
                sb.AppendLine();
            }
        }
        
        // Show results dialog
        var resultsForm = new Form
        {
            Text = "Inventory Comparison Results",
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
        
        var exportButton = new Button
        {
            Text = "Export Results",
            Dock = DockStyle.Bottom,
            Height = 30
        };
        
        exportButton.Click += (s, e) => {
            var saveDialog = new SaveFileDialog
            {
                Filter = "Text files (*.txt)|*.txt",
                Title = "Export Comparison Results",
                FileName = $"Comparison_{player1.UID}_vs_{player2.UID}.txt"
            };
            
            if (saveDialog.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    File.WriteAllText(saveDialog.FileName, sb.ToString());
                    MessageBox.Show($"Results exported to {saveDialog.FileName}", 
                        "Export Successful", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error exporting results: {ex.Message}", 
                        "Export Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        };

        resultsForm.Controls.Add(textBox);
        resultsForm.Controls.Add(exportButton);
        resultsForm.Controls.Add(closeButton);
        resultsForm.Show();
    }
}

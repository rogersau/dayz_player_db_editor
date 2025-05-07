namespace DZ_Players
{
    partial class PlayerEditor
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            label1 = new Label();
            searchPlayer = new TextBox();
            label2 = new Label();
            searchPlayerButton = new Button();
            groupBox1 = new GroupBox();
            countItemsButton = new Button();
            clearDuplicatesListButton = new Button();
            searchDuplicatesButton = new Button();
            deleteCharFromDBButton = new Button();
            cleanInventoryButton = new Button();
            deleteDuplicatesButton = new Button();
            exportDuplicatesButton = new Button();
            label4 = new Label();
            label3 = new Label();
            dupeInventory = new TreeView();
            playerInventory = new TreeView();
            contextMenuStrip1 = new ContextMenuStrip(components);
            copyAsIntArrayMenuItem1 = new ToolStripMenuItem();
            copyParentUIDMenuItem = new ToolStripMenuItem();
            playersListBox = new ListBox();
            groupBox2 = new GroupBox();
            tableLayoutPanel1 = new TableLayoutPanel();
            playerDbId = new TextBox();
            label8 = new Label();
            playerUID = new TextBox();
            playerStatus = new Label();
            playerChartype = new TextBox();
            label7 = new Label();
            label6 = new Label();
            label5 = new Label();
            playerCounter = new Label();
            searchItemTextBox = new TextBox();
            searchItemButton = new Button();
            label9 = new Label();
            groupBox1.SuspendLayout();
            contextMenuStrip1.SuspendLayout();
            groupBox2.SuspendLayout();
            tableLayoutPanel1.SuspendLayout();
            SuspendLayout();
            // 
            // label1
            // 
            label1.Location = new Point(14, 8);
            label1.Name = "label1";
            label1.Size = new Size(413, 24);
            label1.TabIndex = 1;
            label1.Text = "Player List:";
            label1.TextAlign = ContentAlignment.TopCenter;
            // 
            // searchPlayer
            // 
            searchPlayer.Location = new Point(14, 976);
            searchPlayer.Margin = new Padding(3, 4, 3, 4);
            searchPlayer.Name = "searchPlayer";
            searchPlayer.Size = new Size(412, 27);
            searchPlayer.TabIndex = 3;
            // 
            // label2
            // 
            label2.Location = new Point(14, 948);
            label2.Name = "label2";
            label2.Size = new Size(413, 24);
            label2.TabIndex = 4;
            label2.Text = "Search by UID/Steam64";
            label2.TextAlign = ContentAlignment.TopCenter;
            // 
            // searchPlayerButton
            // 
            searchPlayerButton.Location = new Point(14, 1015);
            searchPlayerButton.Margin = new Padding(3, 4, 3, 4);
            searchPlayerButton.Name = "searchPlayerButton";
            searchPlayerButton.Size = new Size(413, 31);
            searchPlayerButton.TabIndex = 5;
            searchPlayerButton.Text = "Search";
            searchPlayerButton.UseVisualStyleBackColor = true;
            searchPlayerButton.Click += Click_Button_Action;
            // 
            // groupBox1
            // 
            groupBox1.Controls.Add(searchItemTextBox);
            groupBox1.Controls.Add(searchItemButton);
            groupBox1.Controls.Add(label9);
            groupBox1.Controls.Add(countItemsButton);
            groupBox1.Controls.Add(clearDuplicatesListButton);
            groupBox1.Controls.Add(searchDuplicatesButton);
            groupBox1.Controls.Add(deleteCharFromDBButton);
            groupBox1.Controls.Add(cleanInventoryButton);
            groupBox1.Controls.Add(deleteDuplicatesButton);
            groupBox1.Controls.Add(exportDuplicatesButton);
            groupBox1.Controls.Add(label4);
            groupBox1.Controls.Add(label3);
            groupBox1.Controls.Add(dupeInventory);
            groupBox1.Controls.Add(playerInventory);
            groupBox1.Location = new Point(433, 217);
            groupBox1.Margin = new Padding(3, 4, 3, 4);
            groupBox1.Name = "groupBox1";
            groupBox1.Padding = new Padding(3, 4, 3, 4);
            groupBox1.Size = new Size(1160, 828);
            groupBox1.TabIndex = 6;
            groupBox1.TabStop = false;
            // 
            // countItemsButton
            // 
            countItemsButton.Location = new Point(7, 676);
            countItemsButton.Margin = new Padding(3, 4, 3, 4);
            countItemsButton.Name = "countItemsButton";
            countItemsButton.Size = new Size(560, 31);
            countItemsButton.TabIndex = 15;
            countItemsButton.Text = "Count Unique Items";
            countItemsButton.UseVisualStyleBackColor = true;
            countItemsButton.Click += Click_Button_Action;
            // 
            // clearDuplicatesListButton
            // 
            clearDuplicatesListButton.Location = new Point(593, 715);
            clearDuplicatesListButton.Margin = new Padding(3, 4, 3, 4);
            clearDuplicatesListButton.Name = "clearDuplicatesListButton";
            clearDuplicatesListButton.Size = new Size(560, 31);
            clearDuplicatesListButton.TabIndex = 14;
            clearDuplicatesListButton.Text = "Clear List";
            clearDuplicatesListButton.UseVisualStyleBackColor = true;
            clearDuplicatesListButton.Click += Click_Button_Action;
            // 
            // searchDuplicatesButton
            // 
            searchDuplicatesButton.Location = new Point(7, 715);
            searchDuplicatesButton.Margin = new Padding(3, 4, 3, 4);
            searchDuplicatesButton.Name = "searchDuplicatesButton";
            searchDuplicatesButton.Size = new Size(560, 31);
            searchDuplicatesButton.TabIndex = 13;
            searchDuplicatesButton.Text = "Find Duplicates";
            searchDuplicatesButton.UseVisualStyleBackColor = true;
            searchDuplicatesButton.Click += Click_Button_Action;
            // 
            // deleteCharFromDBButton
            // 
            deleteCharFromDBButton.Anchor = AnchorStyles.Bottom;
            deleteCharFromDBButton.Location = new Point(7, 792);
            deleteCharFromDBButton.Margin = new Padding(3, 4, 3, 4);
            deleteCharFromDBButton.Name = "deleteCharFromDBButton";
            deleteCharFromDBButton.Size = new Size(560, 31);
            deleteCharFromDBButton.TabIndex = 12;
            deleteCharFromDBButton.Text = "Delete Character from DB";
            deleteCharFromDBButton.UseVisualStyleBackColor = true;
            deleteCharFromDBButton.Click += Click_Button_Action;
            // 
            // cleanInventoryButton
            // 
            cleanInventoryButton.Anchor = AnchorStyles.Bottom;
            cleanInventoryButton.Location = new Point(7, 753);
            cleanInventoryButton.Margin = new Padding(3, 4, 3, 4);
            cleanInventoryButton.Name = "cleanInventoryButton";
            cleanInventoryButton.Size = new Size(560, 31);
            cleanInventoryButton.TabIndex = 11;
            cleanInventoryButton.Text = "Clear Inventory";
            cleanInventoryButton.UseVisualStyleBackColor = true;
            cleanInventoryButton.Click += Click_Button_Action;
            // 
            // deleteDuplicatesButton
            // 
            deleteDuplicatesButton.Anchor = AnchorStyles.Bottom;
            deleteDuplicatesButton.Location = new Point(593, 792);
            deleteDuplicatesButton.Margin = new Padding(3, 4, 3, 4);
            deleteDuplicatesButton.Name = "deleteDuplicatesButton";
            deleteDuplicatesButton.Size = new Size(560, 31);
            deleteDuplicatesButton.TabIndex = 10;
            deleteDuplicatesButton.Text = "Delete Player Duplicates";
            deleteDuplicatesButton.UseVisualStyleBackColor = true;
            deleteDuplicatesButton.Click += Click_Button_Action;
            // 
            // exportDuplicatesButton
            // 
            exportDuplicatesButton.Anchor = AnchorStyles.Bottom;
            exportDuplicatesButton.Location = new Point(593, 753);
            exportDuplicatesButton.Margin = new Padding(3, 4, 3, 4);
            exportDuplicatesButton.Name = "exportDuplicatesButton";
            exportDuplicatesButton.Size = new Size(560, 31);
            exportDuplicatesButton.TabIndex = 9;
            exportDuplicatesButton.Text = "Export to File";
            exportDuplicatesButton.UseVisualStyleBackColor = true;
            exportDuplicatesButton.Click += Click_Button_Action;
            // 
            // label4
            // 
            label4.Location = new Point(593, 23);
            label4.Name = "label4";
            label4.Size = new Size(560, 24);
            label4.TabIndex = 8;
            label4.Text = "Duplicates:";
            label4.TextAlign = ContentAlignment.TopCenter;
            // 
            // label3
            // 
            label3.Location = new Point(7, 23);
            label3.Name = "label3";
            label3.Size = new Size(560, 24);
            label3.TabIndex = 7;
            label3.Text = "Inventory:";
            label3.TextAlign = ContentAlignment.TopCenter;
            // 
            // dupeInventory
            // 
            dupeInventory.Anchor = AnchorStyles.Top | AnchorStyles.Bottom;
            dupeInventory.Location = new Point(593, 51);
            dupeInventory.Margin = new Padding(3, 4, 3, 4);
            dupeInventory.Name = "dupeInventory";
            dupeInventory.Size = new Size(559, 655);
            dupeInventory.TabIndex = 1;
            dupeInventory.NodeMouseClick += NodeMouseClick;
            // 
            // playerInventory
            // 
            playerInventory.Anchor = AnchorStyles.Top | AnchorStyles.Bottom;
            playerInventory.Location = new Point(7, 51);
            playerInventory.Margin = new Padding(3, 4, 3, 4);
            playerInventory.Name = "playerInventory";
            playerInventory.Size = new Size(559, 655);
            playerInventory.TabIndex = 0;
            playerInventory.NodeMouseClick += NodeMouseClick;
            // 
            // searchItemTextBox
            // 
            searchItemTextBox.Location = new Point(593, 637);
            searchItemTextBox.Margin = new Padding(3, 4, 3, 4);
            searchItemTextBox.Name = "searchItemTextBox";
            searchItemTextBox.Size = new Size(394, 27);
            searchItemTextBox.TabIndex = 16;
            // 
            // searchItemButton
            // 
            searchItemButton.Location = new Point(995, 637);
            searchItemButton.Margin = new Padding(3, 4, 3, 4);
            searchItemButton.Name = "searchItemButton";
            searchItemButton.Size = new Size(158, 31);
            searchItemButton.TabIndex = 17;
            searchItemButton.Text = "Search Item";
            searchItemButton.UseVisualStyleBackColor = true;
            searchItemButton.Click += Click_Button_Action;
            // 
            // label9
            // 
            label9.Location = new Point(593, 609);
            label9.Name = "label9";
            label9.Size = new Size(560, 24);
            label9.TabIndex = 18;
            label9.Text = "Search for Item:";
            label9.TextAlign = ContentAlignment.TopCenter;
            // 
            // contextMenuStrip1
            // 
            contextMenuStrip1.ImageScalingSize = new Size(20, 20);
            contextMenuStrip1.Items.AddRange(new ToolStripItem[] { copyAsIntArrayMenuItem1, copyParentUIDMenuItem });
            contextMenuStrip1.Name = "contextMenuStrip1";
            contextMenuStrip1.Size = new Size(189, 52);
            // 
            // copyAsIntArrayMenuItem1
            // 
            copyAsIntArrayMenuItem1.Name = "copyAsIntArrayMenuItem1";
            copyAsIntArrayMenuItem1.Size = new Size(188, 24);
            copyAsIntArrayMenuItem1.Text = "Copy as int[]";
            copyAsIntArrayMenuItem1.Click += copyAsIntArrayMenuItem1_Click;
            // 
            // copyParentUIDMenuItem
            // 
            copyParentUIDMenuItem.Name = "copyParentUIDMenuItem";
            copyParentUIDMenuItem.Size = new Size(188, 24);
            copyParentUIDMenuItem.Text = "Copy Owner UID";
            copyParentUIDMenuItem.Click += copyParentUIDMenuItem_Click;
            // 
            // playersListBox
            // 
            playersListBox.FormattingEnabled = true;
            playersListBox.ItemHeight = 20;
            playersListBox.Location = new Point(14, 39);
            playersListBox.Margin = new Padding(3, 4, 3, 4);
            playersListBox.Name = "playersListBox";
            playersListBox.Size = new Size(412, 884);
            playersListBox.TabIndex = 7;
            playersListBox.SelectedIndexChanged += SelectNextPlayer;
            // 
            // groupBox2
            // 
            groupBox2.Controls.Add(tableLayoutPanel1);
            groupBox2.Location = new Point(433, 39);
            groupBox2.Margin = new Padding(3, 4, 3, 4);
            groupBox2.Name = "groupBox2";
            groupBox2.Padding = new Padding(3, 4, 3, 4);
            groupBox2.Size = new Size(1160, 171);
            groupBox2.TabIndex = 8;
            groupBox2.TabStop = false;
            groupBox2.Text = "Player";
            // 
            // tableLayoutPanel1
            // 
            tableLayoutPanel1.ColumnCount = 2;
            tableLayoutPanel1.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 206F));
            tableLayoutPanel1.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            tableLayoutPanel1.Controls.Add(playerDbId, 1, 0);
            tableLayoutPanel1.Controls.Add(label8, 0, 0);
            tableLayoutPanel1.Controls.Add(playerUID, 1, 1);
            tableLayoutPanel1.Controls.Add(playerStatus, 1, 3);
            tableLayoutPanel1.Controls.Add(playerChartype, 1, 2);
            tableLayoutPanel1.Controls.Add(label7, 0, 3);
            tableLayoutPanel1.Controls.Add(label6, 0, 2);
            tableLayoutPanel1.Controls.Add(label5, 0, 1);
            tableLayoutPanel1.Dock = DockStyle.Fill;
            tableLayoutPanel1.Location = new Point(3, 24);
            tableLayoutPanel1.Margin = new Padding(3, 4, 3, 4);
            tableLayoutPanel1.Name = "tableLayoutPanel1";
            tableLayoutPanel1.RowCount = 4;
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Absolute, 36F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Absolute, 36F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Absolute, 40F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Absolute, 36F));
            tableLayoutPanel1.Size = new Size(1154, 143);
            tableLayoutPanel1.TabIndex = 18;
            // 
            // playerDbId
            // 
            playerDbId.Dock = DockStyle.Fill;
            playerDbId.Font = new Font("Segoe UI", 9F, FontStyle.Bold, GraphicsUnit.Point);
            playerDbId.Location = new Point(209, 4);
            playerDbId.Margin = new Padding(3, 4, 3, 4);
            playerDbId.Name = "playerDbId";
            playerDbId.ReadOnly = true;
            playerDbId.Size = new Size(942, 27);
            playerDbId.TabIndex = 19;
            // 
            // label8
            // 
            label8.Dock = DockStyle.Fill;
            label8.Location = new Point(3, 0);
            label8.Name = "label8";
            label8.Size = new Size(200, 36);
            label8.TabIndex = 18;
            label8.Text = "DB ID:";
            label8.TextAlign = ContentAlignment.TopCenter;
            // 
            // playerUID
            // 
            playerUID.Dock = DockStyle.Fill;
            playerUID.Location = new Point(209, 40);
            playerUID.Margin = new Padding(3, 4, 3, 4);
            playerUID.Name = "playerUID";
            playerUID.ReadOnly = true;
            playerUID.Size = new Size(942, 27);
            playerUID.TabIndex = 0;
            // 
            // playerStatus
            // 
            playerStatus.Dock = DockStyle.Fill;
            playerStatus.Location = new Point(209, 112);
            playerStatus.Name = "playerStatus";
            playerStatus.Size = new Size(942, 36);
            playerStatus.TabIndex = 17;
            playerStatus.Text = "Missing";
            // 
            // playerChartype
            // 
            playerChartype.Dock = DockStyle.Fill;
            playerChartype.Location = new Point(209, 76);
            playerChartype.Margin = new Padding(3, 4, 3, 4);
            playerChartype.Name = "playerChartype";
            playerChartype.ReadOnly = true;
            playerChartype.Size = new Size(942, 27);
            playerChartype.TabIndex = 15;
            // 
            // label7
            // 
            label7.Dock = DockStyle.Fill;
            label7.Location = new Point(3, 112);
            label7.Name = "label7";
            label7.Size = new Size(200, 36);
            label7.TabIndex = 16;
            label7.Text = "Status:";
            label7.TextAlign = ContentAlignment.TopCenter;
            // 
            // label6
            // 
            label6.Dock = DockStyle.Fill;
            label6.Location = new Point(3, 72);
            label6.Name = "label6";
            label6.Size = new Size(200, 40);
            label6.TabIndex = 14;
            label6.Text = "Character Type:";
            label6.TextAlign = ContentAlignment.TopCenter;
            // 
            // label5
            // 
            label5.Dock = DockStyle.Fill;
            label5.Location = new Point(3, 36);
            label5.Name = "label5";
            label5.Size = new Size(200, 36);
            label5.TabIndex = 13;
            label5.Text = "UID:";
            label5.TextAlign = ContentAlignment.TopCenter;
            // 
            // playerCounter
            // 
            playerCounter.Location = new Point(14, 924);
            playerCounter.Name = "playerCounter";
            playerCounter.Size = new Size(413, 24);
            playerCounter.TabIndex = 9;
            playerCounter.Text = "Records:";
            // 
            // PlayerEditor
            // 
            AutoScaleDimensions = new SizeF(8F, 20F);
            AutoScaleMode = AutoScaleMode.Font;
            Controls.Add(playerCounter);
            Controls.Add(groupBox2);
            Controls.Add(playersListBox);
            Controls.Add(groupBox1);
            Controls.Add(searchPlayerButton);
            Controls.Add(label2);
            Controls.Add(searchPlayer);
            Controls.Add(label1);
            Margin = new Padding(3, 4, 3, 4);
            Name = "PlayerEditor";
            Size = new Size(1597, 1064);
            groupBox1.ResumeLayout(false);
            groupBox1.PerformLayout();
            contextMenuStrip1.ResumeLayout(false);
            groupBox2.ResumeLayout(false);
            tableLayoutPanel1.ResumeLayout(false);
            tableLayoutPanel1.PerformLayout();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion
        private Label label1;
        private TextBox searchPlayer;
        private Label label2;
        private Button searchPlayerButton;
        private GroupBox groupBox1;
        private Button exportDuplicatesButton;
        private Label label4;
        private Label label3;
        private TreeView dupeInventory;
        private TreeView playerInventory;
        private Button deleteCharFromDBButton;
        private Button cleanInventoryButton;
        private Button deleteDuplicatesButton;
        private ListBox playersListBox;
        private GroupBox groupBox2;
        private TextBox playerUID;
        private TextBox playerChartype;
        private Label label6;
        private Label label5;
        private Label playerStatus;
        private Label label7;
        private Label playerCounter;
        private Button clearDuplicatesListButton;
        private Button searchDuplicatesButton;
        private TableLayoutPanel tableLayoutPanel1;
        private TextBox playerDbId;
        private Label label8;
        private ContextMenuStrip contextMenuStrip1;
        private ToolStripMenuItem copyAsIntArrayMenuItem1;
        private ToolStripMenuItem copyParentUIDMenuItem;
        private Button countItemsButton;
        private TextBox searchItemTextBox;
        private Button searchItemButton;
        private Label label9;
    }
}

// Slack Connect Application JavaScript

class SlackConnectApp {
    constructor() {
        // Application data from provided JSON
        this.appData = {
            channels: [
                {"id": "C1234567890", "name": "general", "type": "public"},
                {"id": "C2345678901", "name": "random", "type": "public"},
                {"id": "C3456789012", "name": "dev-team", "type": "private"},
                {"id": "C4567890123", "name": "marketing", "type": "public"},
                {"id": "C5678901234", "name": "support", "type": "public"}
            ],
            scheduledMessages: [
                {
                    "id": "msg_001",
                    "channel": {"id": "C1234567890", "name": "general"},
                    "message": "Don't forget about the team meeting tomorrow at 2 PM! We'll be discussing Q1 goals and project updates.",
                    "scheduledTime": "2025-08-11T14:00:00Z",
                    "status": "pending",
                    "createdAt": "2025-08-10T09:15:00Z",
                    "author": "John Doe"
                },
                {
                    "id": "msg_002", 
                    "channel": {"id": "C3456789012", "name": "dev-team"},
                    "message": "Weekly deployment is scheduled for tonight. Please ensure all PRs are merged by 5 PM.",
                    "scheduledTime": "2025-08-10T22:00:00Z",
                    "status": "sent",
                    "createdAt": "2025-08-10T08:30:00Z", 
                    "author": "Sarah Smith"
                },
                {
                    "id": "msg_003",
                    "channel": {"id": "C4567890123", "name": "marketing"},
                    "message": "Campaign launch reminder: All assets should be uploaded to the shared drive by Monday morning.",
                    "scheduledTime": "2025-08-12T09:00:00Z",
                    "status": "pending",
                    "createdAt": "2025-08-09T16:45:00Z",
                    "author": "Mike Johnson"
                },
                {
                    "id": "msg_004",
                    "channel": {"id": "C5678901234", "name": "support"},
                    "message": "Weekend on-call rotation starts Friday. Check the schedule and be prepared for any critical issues.",
                    "scheduledTime": "2025-08-15T18:00:00Z", 
                    "status": "pending",
                    "createdAt": "2025-08-10T11:20:00Z",
                    "author": "Lisa Chen"
                }
            ],
            userInfo: {
                "name": "Demo User",
                "email": "demo@company.com",
                "workspace": "Company Workspace",
                "connected": true,
                "permissions": ["channels:read", "chat:write", "chat:write.public"],
                "tokenExpiry": "2025-08-17T10:49:00Z"
            },
            stats: {
                "totalScheduled": 12,
                "messagesSentToday": 3,
                "activeChannels": 5
            }
        };

        this.currentView = 'dashboard';
        this.selectedMessages = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateChannelSelects();
        this.updateDashboard();
        this.updateScheduledMessages();
        this.updateSettings();
        this.updateConnectionStatus();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar__item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Message form
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.handleMessageSubmit(e));
        }

        // Message type toggle
        document.querySelectorAll('input[name="messageType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.toggleScheduleOptions(e.target.value));
        });

        // Character count
        const messageContent = document.getElementById('messageContent');
        if (messageContent) {
            messageContent.addEventListener('input', () => this.updateCharacterCount());
        }

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showMessagePreview());
        }

        // Search and filters
        const messageSearch = document.getElementById('messageSearch');
        if (messageSearch) {
            messageSearch.addEventListener('input', () => this.filterMessages());
        }

        const channelFilter = document.getElementById('channelFilter');
        if (channelFilter) {
            channelFilter.addEventListener('change', () => this.filterMessages());
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterMessages());
        }

        // Select all functionality
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        }

        // Bulk actions
        const selectAllBtn = document.getElementById('selectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllMessages());
        }

        const bulkCancelBtn = document.getElementById('bulkCancelBtn');
        if (bulkCancelBtn) {
            bulkCancelBtn.addEventListener('click', () => this.bulkCancelMessages());
        }

        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteMessages());
        }

        // Modal handlers
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        // OAuth simulation
        const allowAccess = document.getElementById('allowAccess');
        if (allowAccess) {
            allowAccess.addEventListener('click', () => this.handleOAuthSuccess());
        }

        const denyAccess = document.getElementById('denyAccess');
        if (denyAccess) {
            denyAccess.addEventListener('click', () => this.handleOAuthDeny());
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnectBtn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.handleDisconnect());
        }

        // Toast close
        document.querySelectorAll('.toast__close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.toast').classList.add('hidden');
            });
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => this.closeModal());
        });
    }

    switchView(viewName) {
        // Update active sidebar item
        document.querySelectorAll('.sidebar__item').forEach(item => {
            item.classList.remove('sidebar__item--active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('sidebar__item--active');

        // Update active view
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('view--active');
        });
        document.getElementById(`${viewName}View`).classList.add('view--active');

        this.currentView = viewName;

        // Refresh view-specific data
        if (viewName === 'scheduled') {
            this.updateScheduledMessages();
        }
    }

    populateChannelSelects() {
        const channelSelect = document.getElementById('channelSelect');
        const channelFilter = document.getElementById('channelFilter');

        this.appData.channels.forEach(channel => {
            // Main compose select
            if (channelSelect) {
                const option = document.createElement('option');
                option.value = channel.id;
                option.textContent = `#${channel.name}`;
                channelSelect.appendChild(option);
            }

            // Filter select
            if (channelFilter) {
                const option = document.createElement('option');
                option.value = channel.name;
                option.textContent = `#${channel.name}`;
                channelFilter.appendChild(option);
            }
        });
    }

    updateDashboard() {
        // Update stats
        document.getElementById('totalScheduled').textContent = this.appData.stats.totalScheduled;
        document.getElementById('messagesSentToday').textContent = this.appData.stats.messagesSentToday;
        document.getElementById('activeChannels').textContent = this.appData.stats.activeChannels;

        // Update recent activity
        this.updateRecentActivity();
        this.updateWorkspaceInfo();
    }

    updateRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        const recentMessages = this.appData.scheduledMessages
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        activityList.innerHTML = '';

        if (recentMessages.length === 0) {
            activityList.innerHTML = '<div class="empty-state"><div class="empty-state__title">No recent activity</div><div class="empty-state__description">Your scheduled messages will appear here.</div></div>';
            return;
        }

        recentMessages.forEach(message => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const iconColor = message.status === 'sent' ? 'var(--color-success)' : message.status === 'pending' ? 'var(--color-warning)' : 'var(--color-info)';
            
            activityItem.innerHTML = `
                <div class="activity-item__icon" style="background-color: ${iconColor}15;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${iconColor}">
                        ${message.status === 'sent' ? '<polyline points="20,6 9,17 4,12"></polyline>' : '<circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline>'}
                    </svg>
                </div>
                <div class="activity-item__content">
                    <div class="activity-item__title">Message to #${message.channel.name}</div>
                    <div class="activity-item__time">${this.formatRelativeTime(message.createdAt)}</div>
                </div>
            `;
            
            activityList.appendChild(activityItem);
        });
    }

    updateWorkspaceInfo() {
        const workspaceInfo = document.getElementById('workspaceInfo');
        const user = this.appData.userInfo;
        
        workspaceInfo.innerHTML = `
            <div class="workspace-detail">
                <span class="workspace-detail__label">Workspace</span>
                <span class="workspace-detail__value">${user.workspace}</span>
            </div>
            <div class="workspace-detail">
                <span class="workspace-detail__label">User</span>
                <span class="workspace-detail__value">${user.name}</span>
            </div>
            <div class="workspace-detail">
                <span class="workspace-detail__label">Token Expires</span>
                <span class="workspace-detail__value">${this.formatDate(user.tokenExpiry)}</span>
            </div>
        `;
    }

    updateScheduledMessages() {
        const tableBody = document.getElementById('messagesTableBody');
        const messages = this.getFilteredMessages();
        
        tableBody.innerHTML = '';

        if (messages.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state__title">No messages found</div>
                        <div class="empty-state__description">Try adjusting your filters or create a new message.</div>
                    </td>
                </tr>
            `;
            return;
        }

        messages.forEach(message => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="message-checkbox" data-id="${message.id}"></td>
                <td>#${message.channel.name}</td>
                <td class="message-preview-cell" title="${message.message}">${this.truncateText(message.message, 50)}</td>
                <td>${this.formatDateTime(message.scheduledTime)}</td>
                <td><span class="status status--${message.status}">${this.capitalizeFirst(message.status)}</span></td>
                <td>
                    <div class="message-actions">
                        <button class="action-btn" onclick="app.viewMessage('${message.id}')" title="View">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        ${message.status === 'pending' ? `
                            <button class="action-btn" onclick="app.editMessage('${message.id}')" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                </svg>
                            </button>
                            <button class="action-btn" onclick="app.cancelMessage('${message.id}')" title="Cancel">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </button>
                        ` : ''}
                        <button class="action-btn" onclick="app.deleteMessage('${message.id}')" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.message-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleMessageSelect(e));
        });
    }

    updateSettings() {
        this.updateWorkspaceDetails();
        this.updatePermissionsList();
    }

    updateWorkspaceDetails() {
        const workspaceDetails = document.getElementById('workspaceDetails');
        const user = this.appData.userInfo;
        
        workspaceDetails.innerHTML = `
            <div class="workspace-details">
                <div class="workspace-detail">
                    <span class="workspace-detail__label">Connected Workspace</span>
                    <span class="workspace-detail__value">${user.workspace}</span>
                </div>
                <div class="workspace-detail">
                    <span class="workspace-detail__label">User Account</span>
                    <span class="workspace-detail__value">${user.name} (${user.email})</span>
                </div>
                <div class="workspace-detail">
                    <span class="workspace-detail__label">Token Status</span>
                    <span class="workspace-detail__value">Active (expires ${this.formatDate(user.tokenExpiry)})</span>
                </div>
                <div class="workspace-detail">
                    <span class="workspace-detail__label">Connection Status</span>
                    <span class="workspace-detail__value status status--success">Connected</span>
                </div>
            </div>
        `;
    }

    updatePermissionsList() {
        const permissionsList = document.getElementById('permissionsList');
        const permissions = this.appData.userInfo.permissions;
        
        permissionsList.innerHTML = permissions.map(permission => `
            <div class="permission-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-success)">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                ${permission}
            </div>
        `).join('');
    }

    updateConnectionStatus() {
        const connectionStatus = document.getElementById('connectionStatus');
        const isConnected = this.appData.userInfo.connected;
        
        const dot = connectionStatus.querySelector('.connection-status__dot');
        const text = connectionStatus.querySelector('.connection-status__text');
        
        if (isConnected) {
            dot.classList.remove('connection-status__dot--disconnected');
            text.textContent = 'Connected';
        } else {
            dot.classList.add('connection-status__dot--disconnected');
            text.textContent = 'Not Connected';
        }
    }

    handleMessageSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const messageType = formData.get('messageType');
        const channelId = document.getElementById('channelSelect').value;
        const message = document.getElementById('messageContent').value.trim();
        
        if (!channelId || !message) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (messageType === 'schedule') {
            const scheduleDate = document.getElementById('scheduleDate').value;
            const scheduleTime = document.getElementById('scheduleTime').value;
            
            if (!scheduleDate || !scheduleTime) {
                this.showToast('Please select a date and time for scheduling', 'error');
                return;
            }

            this.scheduleMessage(channelId, message, scheduleDate, scheduleTime);
        } else {
            this.sendMessage(channelId, message);
        }
    }

    scheduleMessage(channelId, message, date, time) {
        const channel = this.appData.channels.find(c => c.id === channelId);
        const scheduledTime = new Date(`${date}T${time}`).toISOString();
        
        const newMessage = {
            id: `msg_${Date.now()}`,
            channel: { id: channelId, name: channel.name },
            message: message,
            scheduledTime: scheduledTime,
            status: 'pending',
            createdAt: new Date().toISOString(),
            author: this.appData.userInfo.name
        };
        
        this.appData.scheduledMessages.push(newMessage);
        this.appData.stats.totalScheduled++;
        
        this.showToast('Message scheduled successfully!', 'success');
        this.clearForm();
        this.updateDashboard();
        this.updateScheduledMessages();
    }

    sendMessage(channelId, message) {
        const channel = this.appData.channels.find(c => c.id === channelId);
        this.appData.stats.messagesSentToday++;
        
        this.showToast(`Message sent to #${channel.name}!`, 'success');
        this.clearForm();
        this.updateDashboard();
    }

    clearForm() {
        document.getElementById('messageForm').reset();
        document.getElementById('messagePreview').style.display = 'none';
        document.getElementById('scheduleOptions').style.display = 'none';
        this.updateCharacterCount();
    }

    toggleScheduleOptions(messageType) {
        const scheduleOptions = document.getElementById('scheduleOptions');
        const submitBtn = document.getElementById('submitBtn');
        
        if (messageType === 'schedule') {
            scheduleOptions.style.display = 'block';
            submitBtn.textContent = 'Schedule Message';
        } else {
            scheduleOptions.style.display = 'none';
            submitBtn.textContent = 'Send Message';
        }
    }

    updateCharacterCount() {
        const messageContent = document.getElementById('messageContent');
        const characterCount = document.getElementById('characterCount');
        
        if (messageContent && characterCount) {
            const count = messageContent.value.length;
            characterCount.textContent = count;
            
            if (count > 3800) {
                characterCount.style.color = 'var(--color-warning)';
            } else if (count > 3900) {
                characterCount.style.color = 'var(--color-error)';
            } else {
                characterCount.style.color = 'var(--color-text-secondary)';
            }
        }
    }

    showMessagePreview() {
        const channelSelect = document.getElementById('channelSelect');
        const messageContent = document.getElementById('messageContent');
        const messagePreview = document.getElementById('messagePreview');
        const previewChannel = document.getElementById('previewChannel');
        const previewMessage = document.getElementById('previewMessage');
        const previewTime = document.getElementById('previewTime');
        
        const selectedChannel = this.appData.channels.find(c => c.id === channelSelect.value);
        const messageType = document.querySelector('input[name="messageType"]:checked').value;
        
        if (!selectedChannel || !messageContent.value.trim()) {
            this.showToast('Please select a channel and enter a message', 'error');
            return;
        }
        
        previewChannel.textContent = `#${selectedChannel.name}`;
        previewMessage.textContent = messageContent.value;
        
        if (messageType === 'schedule') {
            const date = document.getElementById('scheduleDate').value;
            const time = document.getElementById('scheduleTime').value;
            if (date && time) {
                previewTime.textContent = `Scheduled for ${this.formatDateTime(new Date(`${date}T${time}`).toISOString())}`;
            } else {
                previewTime.textContent = 'Scheduled time not set';
            }
        } else {
            previewTime.textContent = 'Sending immediately';
        }
        
        messagePreview.style.display = 'block';
    }

    getFilteredMessages() {
        let filtered = [...this.appData.scheduledMessages];
        
        const searchTerm = document.getElementById('messageSearch')?.value.toLowerCase() || '';
        const channelFilter = document.getElementById('channelFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        
        if (searchTerm) {
            filtered = filtered.filter(msg => 
                msg.message.toLowerCase().includes(searchTerm) ||
                msg.channel.name.toLowerCase().includes(searchTerm)
            );
        }
        
        if (channelFilter) {
            filtered = filtered.filter(msg => msg.channel.name === channelFilter);
        }
        
        if (statusFilter) {
            filtered = filtered.filter(msg => msg.status === statusFilter);
        }
        
        return filtered.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime));
    }

    filterMessages() {
        this.updateScheduledMessages();
        this.selectedMessages.clear();
        this.updateBulkActionButtons();
    }

    handleMessageSelect(e) {
        const messageId = e.target.dataset.id;
        if (e.target.checked) {
            this.selectedMessages.add(messageId);
        } else {
            this.selectedMessages.delete(messageId);
        }
        this.updateBulkActionButtons();
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.message-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            if (checked) {
                this.selectedMessages.add(cb.dataset.id);
            } else {
                this.selectedMessages.delete(cb.dataset.id);
            }
        });
        this.updateBulkActionButtons();
    }

    selectAllMessages() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        selectAllCheckbox.checked = !selectAllCheckbox.checked;
        this.toggleSelectAll(selectAllCheckbox.checked);
    }

    updateBulkActionButtons() {
        const bulkCancelBtn = document.getElementById('bulkCancelBtn');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const hasSelection = this.selectedMessages.size > 0;
        
        if (bulkCancelBtn) bulkCancelBtn.disabled = !hasSelection;
        if (bulkDeleteBtn) bulkDeleteBtn.disabled = !hasSelection;
    }

    bulkCancelMessages() {
        if (this.selectedMessages.size === 0) return;
        
        const cancelled = Array.from(this.selectedMessages).filter(id => {
            const message = this.appData.scheduledMessages.find(m => m.id === id);
            if (message && message.status === 'pending') {
                message.status = 'cancelled';
                return true;
            }
            return false;
        });
        
        this.showToast(`${cancelled.length} messages cancelled`, 'success');
        this.selectedMessages.clear();
        this.updateScheduledMessages();
        this.updateBulkActionButtons();
    }

    bulkDeleteMessages() {
        if (this.selectedMessages.size === 0) return;
        
        const deleted = Array.from(this.selectedMessages);
        this.appData.scheduledMessages = this.appData.scheduledMessages.filter(m => !deleted.includes(m.id));
        
        this.showToast(`${deleted.length} messages deleted`, 'success');
        this.selectedMessages.clear();
        this.updateScheduledMessages();
        this.updateBulkActionButtons();
    }

    viewMessage(messageId) {
        const message = this.appData.scheduledMessages.find(m => m.id === messageId);
        if (!message) return;
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="message-details">
                <div class="form-group">
                    <label class="form-label">Channel</label>
                    <div class="form-value">#${message.channel.name}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Message</label>
                    <div class="form-value" style="white-space: pre-wrap;">${message.message}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Scheduled Time</label>
                    <div class="form-value">${this.formatDateTime(message.scheduledTime)}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <div class="form-value"><span class="status status--${message.status}">${this.capitalizeFirst(message.status)}</span></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Created</label>
                    <div class="form-value">${this.formatDateTime(message.createdAt)} by ${message.author}</div>
                </div>
            </div>
        `;
        
        // Update modal buttons
        const editBtn = document.getElementById('editMessageBtn');
        const cancelBtn = document.getElementById('cancelMessageBtn');
        const deleteBtn = document.getElementById('deleteMessageBtn');
        
        editBtn.style.display = message.status === 'pending' ? 'inline-flex' : 'none';
        cancelBtn.style.display = message.status === 'pending' ? 'inline-flex' : 'none';
        
        editBtn.onclick = () => this.editMessage(messageId);
        cancelBtn.onclick = () => this.cancelMessage(messageId);
        deleteBtn.onclick = () => this.deleteMessage(messageId);
        
        this.showModal();
    }

    editMessage(messageId) {
        this.closeModal();
        this.switchView('compose');
        
        const message = this.appData.scheduledMessages.find(m => m.id === messageId);
        if (message) {
            document.getElementById('channelSelect').value = message.channel.id;
            document.getElementById('messageContent').value = message.message;
            
            const scheduleDate = new Date(message.scheduledTime);
            document.getElementById('scheduleDate').value = scheduleDate.toISOString().split('T')[0];
            document.getElementById('scheduleTime').value = scheduleDate.toTimeString().substring(0, 5);
            
            document.querySelector('input[value="schedule"]').checked = true;
            this.toggleScheduleOptions('schedule');
            this.updateCharacterCount();
        }
    }

    cancelMessage(messageId) {
        const message = this.appData.scheduledMessages.find(m => m.id === messageId);
        if (message && message.status === 'pending') {
            message.status = 'cancelled';
            this.showToast('Message cancelled successfully', 'success');
            this.closeModal();
            this.updateScheduledMessages();
        }
    }

    deleteMessage(messageId) {
        this.appData.scheduledMessages = this.appData.scheduledMessages.filter(m => m.id !== messageId);
        this.showToast('Message deleted successfully', 'success');
        this.closeModal();
        this.updateScheduledMessages();
    }

    showModal() {
        document.getElementById('messageModal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('messageModal').classList.add('hidden');
        document.getElementById('oauthModal').classList.add('hidden');
    }

    handleDisconnect() {
        this.appData.userInfo.connected = false;
        document.getElementById('oauthModal').classList.remove('hidden');
    }

    handleOAuthSuccess() {
        this.appData.userInfo.connected = true;
        this.updateConnectionStatus();
        this.closeModal();
        this.showToast('Successfully connected to Slack!', 'success');
    }

    handleOAuthDeny() {
        this.closeModal();
        this.showToast('Connection denied', 'error');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const messageEl = toast.querySelector('.toast__message');
        
        messageEl.textContent = message;
        
        // Update toast styling based on type
        toast.className = `toast toast--${type}`;
        toast.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Utility functions
    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatRelativeTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }

    truncateText(text, maxLength) {
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize the application
const app = new SlackConnectApp();

// Global functions for onclick handlers
window.app = app;
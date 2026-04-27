# Notification Module - Developer Quick Reference

## 🚀 Quick Start for Developers

This is a one-page reference for developers working with the notification system.

---

## 📦 BACKEND: Trigger a Notification

### Step 1: Inject the Event Publisher
```java
@Autowired
private NotificationEventPublisher eventPublisher;
```

### Step 2: Publish an Event
```java
// Declaration submitted
eventPublisher.publishDeclarationSubmitted(
    declarationId,
    templeId,
    submittedByUserId
);

// Declaration approved
eventPublisher.publishDeclarationApproved(
    declarationId,
    templeId,
    approvedByUserId
);

// Declaration rejected
eventPublisher.publishDeclarationRejected(
    declarationId,
    templeId,
    rejectedByUserId,
    "Reason for rejection"
);

// Clarification requested
eventPublisher.publishDeclarationClarificationRequested(
    declarationId,
    templeId,
    requestedByUserId,
    "Clarification details"
);

// Declaration overdue
eventPublisher.publishDeclarationOverdue(
    declarationId,
    templeId,
    assignedToUserId
);

// Temple profile created
eventPublisher.publishTempleProfileCreated(
    templeId,
    createdByUserId
);

// Employee created
eventPublisher.publishEmployeeCreated(
    employeeId,
    templeId,
    createdByUserId
);

// Document uploaded
eventPublisher.publishDocumentUploaded(
    documentId,
    templeId,
    uploadedByUserId,
    documentType
);
```

### Available Event Methods
```java
// Temple Events
publishTempleProfileCreated(Long templeId, Long userId)
publishTempleProfileUpdated(Long templeId, Long userId)

// Trust Events
publishTrustSubmitted(Long trustId, Long templeId, Long userId)
publishBoardMemberUpdated(Long boardMemberId, Long trustId, Long userId)

// Employee Events
publishEmployeeCreated(Long employeeId, Long templeId, Long userId)
publishEmployeeUpdated(Long employeeId, Long templeId, Long userId)
publishEmployeeDeleted(Long employeeId, Long templeId, Long userId)

// Contractor Events
publishContractorCreated(Long contractorId, Long templeId, Long userId)
publishContractorUpdated(Long contractorId, Long templeId, Long userId)

// Declaration Events
publishDeclarationSubmitted(Long declarationId, Long templeId, Long userId)
publishDeclarationApproved(Long declarationId, Long templeId, Long userId)
publishDeclarationRejected(Long declarationId, Long templeId, Long userId, String reason)
publishDeclarationClarificationRequested(Long declarationId, Long templeId, Long userId, String details)
publishDeclarationOverdue(Long declarationId, Long templeId, Long userId)

// Document Events
publishDocumentUploaded(Long documentId, Long templeId, Long userId, String documentType)
```

---

## 🎨 FRONTEND: Use Notifications

### Option 1: Use the Custom Hook
```typescript
import { useNotifications } from '@/features/notification/hooks/useNotifications'

function MyComponent() {
  const {
    notifications,      // Array of notifications
    unreadCount,        // Number of unread notifications
    isLoading,          // Loading state
    markAsRead,         // Function to mark as read
    markAllAsRead,      // Function to mark all as read
    refetch             // Function to manually refetch
  } = useNotifications()

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.body}</p>
        </div>
      ))}
    </div>
  )
}
```

### Option 2: Use RTK Query Directly
```typescript
import {
  useListNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation
} from '@/features/notification/notificationApi'

function MyComponent() {
  // Fetch notifications
  const { data, isLoading } = useListNotificationsQuery({
    page: 0,
    size: 10
  })

  // Mark as read
  const [markRead] = useMarkReadMutation()
  
  const handleMarkRead = async (id: number) => {
    await markRead(id).unwrap()
  }

  // Mark all as read
  const [markAllRead] = useMarkAllReadMutation()
  
  const handleMarkAllRead = async () => {
    await markAllRead().unwrap()
  }

  return (
    <div>
      {data?.data?.content?.map(notification => (
        <div key={notification.id}>
          {notification.title}
        </div>
      ))}
    </div>
  )
}
```

### Option 3: Use Existing Components
```typescript
import { NotificationBell } from '@/features/notification/components/NotificationBell'
import { NotificationCard } from '@/features/notification/components/NotificationCard'

function MyComponent() {
  return (
    <div>
      {/* Just add the bell - it handles everything */}
      <NotificationBell />
      
      {/* Or use individual cards */}
      <NotificationCard
        notification={notification}
        compact={false}
        onClick={() => console.log('Clicked')}
      />
    </div>
  )
}
```

### Navigate to Notification Pages
```typescript
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routePaths'

function MyComponent() {
  const navigate = useNavigate()

  return (
    <div>
      <button onClick={() => navigate(ROUTE_PATHS.NOTIFICATIONS)}>
        View All Notifications
      </button>
      
      <button onClick={() => navigate(ROUTE_PATHS.NOTIFICATION_PREFERENCES)}>
        Manage Preferences
      </button>
    </div>
  )
}
```

---

## 📊 DATA TYPES

### TypeScript Types
```typescript
// Priority levels
type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Categories
type NotificationCategory = 
  | 'SUBMISSION'
  | 'APPROVAL'
  | 'REJECTION'
  | 'CLARIFICATION'
  | 'SITE_VISIT'
  | 'REMINDER'
  | 'OVERDUE'
  | 'DOCUMENT'
  | 'SYSTEM'

// Module types
type ModuleType = 
  | 'TEMPLE'
  | 'TRUST'
  | 'EMPLOYEE'
  | 'CONTRACTOR'
  | 'DECLARATION'
  | 'DOCUMENT'
  | 'SYSTEM'

// Notification response
interface NotificationResponse {
  id: number
  title: string
  body: string
  priority?: NotificationPriority
  category?: NotificationCategory
  actionUrl?: string
  referenceType?: string
  referenceId?: number
  read: boolean
  readAt?: string
  createdAt: string
}

// Preference response
interface NotificationPreferenceResponse {
  id: number
  moduleType: ModuleType
  inAppEnabled: boolean
  emailEnabled: boolean
}
```

### Java Enums
```java
// Priority
public enum NotificationPriority {
    LOW, MEDIUM, HIGH, CRITICAL
}

// Category
public enum NotificationCategory {
    SUBMISSION, APPROVAL, REJECTION, CLARIFICATION,
    SITE_VISIT, REMINDER, OVERDUE, DOCUMENT, SYSTEM
}

// Module Type
public enum ModuleType {
    TEMPLE, TRUST, EMPLOYEE, CONTRACTOR,
    DECLARATION, DOCUMENT, SYSTEM
}

// Channel
public enum NotificationChannel {
    IN_APP, EMAIL, BOTH
}
```

---

## 🔗 API ENDPOINTS

### Notifications
```
GET    /api/notifications?page=0&size=10
       → Get paginated notifications
       
POST   /api/notifications/{id}/read
       → Mark single notification as read
       
POST   /api/notifications/read-all
       → Mark all notifications as read
```

### Preferences
```
GET    /api/notification-preferences
       → Get user's notification preferences
       
PUT    /api/notification-preferences
       → Update notification preferences
       Body: {
         preferences: [
           {
             moduleType: "DECLARATION",
             inAppEnabled: true,
             emailEnabled: true
           }
         ]
       }
```

---

## 🎨 PRIORITY COLORS

Use these Tailwind classes for consistent priority styling:

```typescript
const priorityColors = {
  CRITICAL: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    icon: 'text-red-600',
    border: 'border-red-500'
  },
  HIGH: {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'text-orange-600',
    border: 'border-orange-500'
  },
  MEDIUM: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'text-blue-600',
    border: 'border-blue-500'
  },
  LOW: {
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: 'text-gray-600',
    border: 'border-gray-500'
  }
}
```

---

## 🔧 CONFIGURATION

### Backend: application.yml
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

notification:
  from-email: noreply@templeregistry.gov.in
  from-name: Temple Registry System
  polling-interval: 30000  # 30 seconds
```

### Frontend: Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_NOTIFICATION_POLLING_INTERVAL=30000
```

---

## 🐛 DEBUGGING

### Check Backend Logs
```bash
# Look for event publishing
grep "Publishing.*Event" backend/logs/application.log

# Look for notification creation
grep "Creating notification" backend/logs/application.log

# Look for email sending
grep "Sending email" backend/logs/application.log
```

### Check Frontend Console
```javascript
// Enable RTK Query logging
localStorage.setItem('debug', 'rtk-query:*')

// Check notification state
console.log(store.getState().notificationApi)

// Check polling
console.log('Polling active:', /* check useEffect */)
```

### Common Issues

**Notifications not appearing?**
- Check backend event is being published
- Check notification is being created in database
- Check frontend polling is active
- Check API endpoint returns data

**Email not sending?**
- Check SMTP configuration
- Check user preferences (emailEnabled)
- Check priority is HIGH or CRITICAL
- Check email_delivery_logs table

**Badge not updating?**
- Check polling interval (30 seconds)
- Check API returns correct unread count
- Check RTK Query cache invalidation
- Refresh page to force update

---

## 📝 COMMON PATTERNS

### Pattern 1: Notify on Entity Creation
```java
@Service
public class MyService {
    @Autowired
    private NotificationEventPublisher eventPublisher;
    
    public MyEntity create(MyEntityRequest request) {
        MyEntity entity = // ... create entity
        repository.save(entity);
        
        // Publish notification event
        eventPublisher.publishMyEntityCreated(
            entity.getId(),
            entity.getRelatedId(),
            getCurrentUserId()
        );
        
        return entity;
    }
}
```

### Pattern 2: Notify on Status Change
```java
public MyEntity updateStatus(Long id, Status newStatus) {
    MyEntity entity = repository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Not found"));
    
    Status oldStatus = entity.getStatus();
    entity.setStatus(newStatus);
    repository.save(entity);
    
    // Publish different events based on status
    if (newStatus == Status.APPROVED) {
        eventPublisher.publishMyEntityApproved(id, getCurrentUserId());
    } else if (newStatus == Status.REJECTED) {
        eventPublisher.publishMyEntityRejected(id, getCurrentUserId(), "Reason");
    }
    
    return entity;
}
```

### Pattern 3: Show Notification Count in UI
```typescript
function MyComponent() {
  const { unreadCount } = useNotifications()
  
  return (
    <div>
      <h2>My Dashboard</h2>
      {unreadCount > 0 && (
        <div className="bg-yellow-100 p-4 rounded">
          You have {unreadCount} unread notifications
        </div>
      )}
    </div>
  )
}
```

### Pattern 4: Navigate on Notification Click
```typescript
function MyNotificationList() {
  const navigate = useNavigate()
  const { notifications, markAsRead } = useNotifications()
  
  const handleClick = async (notification: NotificationResponse) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    // Navigate to action URL
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }
  
  return (
    <div>
      {notifications.map(n => (
        <div key={n.id} onClick={() => handleClick(n)}>
          {n.title}
        </div>
      ))}
    </div>
  )
}
```

---

## 🧪 TESTING

### Backend Unit Test
```java
@Test
public void testNotificationEventPublished() {
    // Arrange
    Long declarationId = 1L;
    Long templeId = 1L;
    Long userId = 1L;
    
    // Act
    eventPublisher.publishDeclarationSubmitted(declarationId, templeId, userId);
    
    // Assert
    verify(applicationEventPublisher).publishEvent(any(DeclarationSubmittedEvent.class));
}
```

### Frontend Component Test
```typescript
import { render, screen } from '@testing-library/react'
import { NotificationBell } from './NotificationBell'

test('renders notification bell with badge', () => {
  render(<NotificationBell />)
  
  const bell = screen.getByRole('button')
  expect(bell).toBeInTheDocument()
  
  const badge = screen.getByText('5')
  expect(badge).toBeInTheDocument()
})
```

### E2E Test
```typescript
test('user can view and mark notification as read', async () => {
  // Login
  await login('ta-user', 'password')
  
  // Check bell has badge
  const badge = await screen.findByText('1')
  expect(badge).toBeInTheDocument()
  
  // Click bell
  await userEvent.click(screen.getByRole('button', { name: /notifications/i }))
  
  // Click notification
  await userEvent.click(screen.getByText('Declaration Approved'))
  
  // Verify navigation
  expect(window.location.pathname).toBe('/ta/declarations/1')
  
  // Verify badge updated
  expect(screen.queryByText('1')).not.toBeInTheDocument()
})
```

---

## 📚 FILE LOCATIONS

### Backend
```
backend/src/main/java/com/templeregistry/
├── event/
│   ├── base/                    # Base event classes
│   ├── {module}/                # Module-specific events
│   ├── listener/                # Event listeners
│   └── NotificationEventPublisher.java
├── service/notification/
│   ├── NotificationDispatchService.java
│   └── EmailService.java
├── entity/notification/
│   ├── InAppNotification.java
│   ├── NotificationPreference.java
│   └── EmailDeliveryLog.java
└── controller/notification/
    └── NotificationPreferenceController.java
```

### Frontend
```
frontend/src/features/notification/
├── notificationApi.ts           # RTK Query API
├── components/
│   ├── NotificationBell.tsx
│   ├── NotificationCard.tsx
│   └── NotificationDropdown.tsx
├── pages/
│   ├── NotificationInboxPage.tsx
│   └── NotificationPreferencesPage.tsx
└── hooks/
    └── useNotifications.ts
```

---

## 🎯 QUICK CHECKLIST

When adding a new notification event:

- [ ] Create event class in `backend/src/main/java/com/templeregistry/event/{module}/`
- [ ] Add publish method to `NotificationEventPublisher.java`
- [ ] Add event handler to `NotificationEventListener.java`
- [ ] Define notification title, body, priority, category
- [ ] Set recipient role and action URL
- [ ] Test event publishing
- [ ] Test notification creation
- [ ] Test email sending (if HIGH/CRITICAL)
- [ ] Verify frontend displays notification
- [ ] Update documentation

---

## 🚀 DEPLOYMENT

### Pre-deployment Checklist
- [ ] Database migration V43 applied
- [ ] SMTP credentials configured
- [ ] Environment variables set
- [ ] Backend tests passing
- [ ] Frontend tests passing
- [ ] Manual testing completed
- [ ] Documentation updated

### Environment Variables
```bash
# Backend
export SMTP_USERNAME=your-email@example.com
export SMTP_PASSWORD=your-app-password
export NOTIFICATION_FROM_EMAIL=noreply@templeregistry.gov.in

# Frontend
export VITE_API_BASE_URL=https://api.templeregistry.gov.in
```

---

## 📞 SUPPORT

### Documentation
- `NOTIFICATION_MODULE_COMPLETE_SUMMARY.md` - Complete overview
- `NOTIFICATION_EVENT_SYSTEM_IMPLEMENTATION.md` - Backend events
- `PHASE_2_IMPLEMENTATION_COMPLETE.md` - Email & preferences
- `PHASE_3_COMPLETE_IMPLEMENTATION_SUMMARY.md` - Frontend UI
- `NOTIFICATION_TESTING_GUIDE.md` - Testing guide

### Need Help?
- Check console logs for errors
- Review API responses in Network tab
- Check Redux DevTools for state
- Review backend logs for event publishing
- Verify database records created

---

**Quick Reference Version**: 1.0  
**Last Updated**: April 24, 2026  
**Status**: Production Ready

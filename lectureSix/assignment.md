# Lecture Six - Assignment
## Assignment Description:

1. Import your project developed for assignment 5
2. Add publisher service using Notifiers or Subscriptions (define relevant method and object state to be published);
3. Create a simple UI to present the data extracted through the notifier/subscription service.

## Sequence diagram

```mermaid
sequenceDiagram
    participant Contract
    participant UI
    Contract->>Contract: create Notifier/Subscription service
    Contract->>UI: Import notifier
    UI->>UI: Create a local notifier object
    Contract->>Contract: Use updater to publish state update
    Contract-->>UI: state update
    UI->>UI: Display the updated information 
```
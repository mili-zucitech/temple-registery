import { DbClient } from '../db-client';
import { WorkflowAssertions } from './workflow.assert';
import { NotificationAssertions } from './notification.assert';
import { AuditAssertions } from './audit.assert';
import { IntegrityAssertions } from './integrity.assert';

export class DbAssertions {
  readonly workflow: WorkflowAssertions;
  readonly notification: NotificationAssertions;
  readonly audit: AuditAssertions;
  readonly integrity: IntegrityAssertions;

  constructor(db: DbClient) {
    this.workflow = new WorkflowAssertions(db);
    this.notification = new NotificationAssertions(db);
    this.audit = new AuditAssertions(db);
    this.integrity = new IntegrityAssertions(db);
  }
}

-- Allow temples to be created without a grade assigned.
-- Grade is set during the approval workflow, not at auto-creation time.
ALTER TABLE temples MODIFY COLUMN grade VARCHAR(5) NULL;

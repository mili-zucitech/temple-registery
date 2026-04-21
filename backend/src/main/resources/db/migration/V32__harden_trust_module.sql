ALTER TABLE board_meetings DROP FOREIGN KEY fk_board_meetings_trust;
ALTER TABLE trust_financials DROP FOREIGN KEY fk_tf_trust;

UPDATE board_members bm
JOIN trust_registrations old_trust ON old_trust.id = bm.trust_id
JOIN trusts new_trust ON new_trust.temple_id = old_trust.temple_id
SET bm.trust_id = new_trust.id;

UPDATE board_meetings meeting
JOIN trust_registrations old_trust ON old_trust.id = meeting.trust_id
JOIN trusts new_trust ON new_trust.temple_id = old_trust.temple_id
SET meeting.trust_id = new_trust.id;

UPDATE trust_financials financial
JOIN trust_registrations old_trust ON old_trust.id = financial.trust_id
JOIN trusts new_trust ON new_trust.temple_id = old_trust.temple_id
SET financial.trust_id = new_trust.id;

UPDATE trusts
SET date_of_registration = CURDATE()
WHERE date_of_registration > CURDATE();

UPDATE temples t
SET t.trust_registered = EXISTS (
    SELECT 1
    FROM trusts tr
    WHERE tr.temple_id = t.id
      AND tr.is_deleted = 0
);

ALTER TABLE trusts
    ADD CONSTRAINT uq_trust_registration_number UNIQUE (trust_registration_number);

ALTER TABLE board_meetings
    ADD CONSTRAINT fk_board_meetings_trust
        FOREIGN KEY (trust_id) REFERENCES trusts (id);

ALTER TABLE trust_financials
    ADD CONSTRAINT fk_tf_trust
        FOREIGN KEY (trust_id) REFERENCES trusts (id);

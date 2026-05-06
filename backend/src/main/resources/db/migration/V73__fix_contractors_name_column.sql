-- V73: Make contractors.name column nullable (legacy column; entity uses company_name)
ALTER TABLE contractors MODIFY COLUMN name varchar(255) NULL DEFAULT NULL;

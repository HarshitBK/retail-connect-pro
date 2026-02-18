-- Allow public read for document URLs (e.g. resume) so reserved/hired candidate links work for employers.
-- Upload path remains restricted to own folder (user_id).
UPDATE storage.buckets SET public = true WHERE id = 'documents';

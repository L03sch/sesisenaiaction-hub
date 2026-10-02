-- Principal Admin may authorize ordinary administrators, never a second owner.
ALTER TABLE private.user_enrollments DROP CONSTRAINT user_enrollments_role_check;
ALTER TABLE private.user_enrollments ADD CONSTRAINT user_enrollments_role_check
  CHECK (role IN ('professor', 'coordenador', 'admin'));
-- profiles.is_absolute_admin retains its false default and unique protected flag.

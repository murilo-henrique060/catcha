CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'superadmin');

ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';

-- Insert superadmin root into auth.users (if it doesn't exist)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'root@catcha.com', 
  extensions.crypt('password', extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO UPDATE SET email = 'root@catcha.com';

-- Insert into auth.identities to allow login
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000000', 'root@catcha.com')::jsonb,
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;
-- Insert into public.profiles
INSERT INTO public.profiles (id, username, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'root', 'superadmin')
ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

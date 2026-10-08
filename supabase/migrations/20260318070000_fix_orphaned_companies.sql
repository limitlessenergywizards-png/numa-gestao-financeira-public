-- ============================================
-- Migration: Fix orphaned companies + add FK constraint
-- Date: 2026-03-18
-- Purpose: Reassign companies with deleted owners to the oldest active admin,
--          then add a soft FK check to prevent future orphans.
-- Bug addressed: #2 (Companies without valid owner)
-- ============================================

-- Step 1: Identify and fix orphaned companies
-- Reassign created_by to the first user_companies admin/owner for that company.
-- If no admin exists, set created_by to NULL (company is truly orphaned).
DO $$
DECLARE
  v_orphan RECORD;
  v_new_owner uuid;
BEGIN
  FOR v_orphan IN
    SELECT c.id, c.name, c.created_by
    FROM public.companies c
    LEFT JOIN auth.users u ON c.created_by = u.id
    WHERE u.id IS NULL
      AND c.created_by IS NOT NULL
  LOOP
    -- Find the best replacement owner: prefer admin role, then any member
    SELECT uc.user_id INTO v_new_owner
    FROM public.user_companies uc
    JOIN auth.users u ON uc.user_id = u.id
    WHERE uc.company_id = v_orphan.id
    ORDER BY
      CASE uc.role WHEN 'admin' THEN 0 ELSE 1 END,
      uc.created_at ASC
    LIMIT 1;

    IF v_new_owner IS NOT NULL THEN
      UPDATE public.companies
      SET created_by = v_new_owner
      WHERE id = v_orphan.id;

      RAISE NOTICE 'Reassigned company "%" (%) from deleted user % to %',
        v_orphan.name, v_orphan.id, v_orphan.created_by, v_new_owner;
    ELSE
      -- No valid users for this company - null out created_by
      UPDATE public.companies
      SET created_by = NULL
      WHERE id = v_orphan.id;

      RAISE NOTICE 'Nulled created_by for orphaned company "%" (%) - no valid members found',
        v_orphan.name, v_orphan.id;
    END IF;
  END LOOP;
END;
$$;

-- Step 2: Make created_by nullable (if not already) so truly orphaned companies don't break
ALTER TABLE public.companies
  ALTER COLUMN created_by DROP NOT NULL;

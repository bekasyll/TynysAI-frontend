// Builds a profile-update payload that lets the user CLEAR text fields.
//
// Backend contract (user-service Patient/DoctorProfileService.updateMyProfile):
//   - field absent  -> leave the stored value unchanged (partial update)
//   - field == ""    -> overwrite with empty (i.e. clear the field)
//   - field == value -> set it
//
// So an emptied text field must be sent as "" (not dropped) to actually clear.
// Non-string fields (dates, enums, numbers) can't be serialized to the backend
// type when empty, so we omit them instead — clearing those isn't supported and
// omitting just leaves the stored value untouched.
export function buildProfileUpdate<T extends object>(
  data: T,
  omitWhenEmpty: readonly (keyof T)[],
): Partial<T> {
  const omit = new Set(omitWhenEmpty as readonly string[]);
  return Object.fromEntries(
    Object.entries(data).filter(([key, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'number' && Number.isNaN(value)) return false;
      if (value === '' && omit.has(key)) return false;
      return true;
    }),
  ) as Partial<T>;
}

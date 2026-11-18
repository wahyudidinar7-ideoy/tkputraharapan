# Security Specification: PPDB Online TK Ceria Bangsa

## 1. Data Invariants
1. **PII Protection**: Dokumen pada `/ppdb_registrations/{registrationId}` berisi data pribadi anak dan orang tua (`childName`, `birthDate`, `parentWhatsapp`, `address`). Pengunjung umum (anonymous/unauthenticated) **TIDAK BOLEH** membaca (`get` atau `list`), mengubah (`update`), atau menghapus (`delete`) dokumen pendaftar mana pun. Hanya admin sekolah terverifikasi (`isAdmin()`) yang dapat membaca, memperbarui status, dan menghapus pendaftaran.
2. **Safe Public Registration Creation**: Calon orang tua dapat mengirimkan formulir pendaftaran baru ke `/ppdb_registrations/{registrationId}`, namun:
   - Status awal wajib `'menunggu'` (tidak bisa langsung `'diterima'` atau `'jadwal_trial'`).
   - Tidak boleh menyisipkan field liar (`keys().hasOnly(...)`) atau field admin (`trialDate`, `adminNotes`).
   - `createdAt` dan `updatedAt` wajib sama dengan `request.time`.
   - ID dokumen wajib lolos regex `^[a-zA-Z0-9_\-]+$` dengan panjang `<= 128`.
3. **Public Non-PII Quota Readability**: `/ppdb_stats/{programCode}` hanya menyimpan `programCode`, `capacity`, `enrolledCount`, dan `updatedAt` (nol PII). Semua pengunjung dapat membaca untuk melihat sisa kursi secara real-time. Pembaruan manual hanya boleh oleh admin, sedangkan penambahannya saat pendaftaran baru dijaga oleh `getAfter`/`existsAfter` atau inkremen `+1` yang terikat pada dokumen pendaftaran baru.
4. **Admin Bootstrapping & Spoof Guard**: `isAdmin()` memverifikasi `request.auth != null && request.auth.token.email_verified == true` serta kecocokan email admin sekolah (`wahyudidinar7@gmail.com`) atau keberadaan dokumen `/admins/$(request.auth.uid)`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated List PII**: `list /ppdb_registrations` tanpa auth admin -> DENIED.
2. **Unauthenticated Get PII**: `get /ppdb_registrations/reg-123` tanpa auth admin -> DENIED.
3. **Non-Admin User Read PII**: User biasa login Google (`bukan-admin@gmail.com`) mencoba `get` atau `list` `/ppdb_registrations` -> DENIED.
4. **Self-Approved Status on Create**: Submit pendaftaran baru dengan `"status": "diterima"` -> DENIED.
5. **Shadow Field Injection on Create**: Submit pendaftaran baru dengan field tambahan `"isVerified": true` -> DENIED.
6. **Admin Notes Injection on Create**: Submit pendaftaran baru dengan field `"adminNotes": "Gratis SPP"` -> DENIED.
7. **Timestamp Forgery on Create**: Submit pendaftaran baru dengan `createdAt` tanggal lampau (bukan `request.time`) -> DENIED.
8. **Path Variable Poisoning**: Create ke `/ppdb_registrations/bad$id!@#` atau ID > 128 karakter -> DENIED.
9. **Resource Exhaustion (1MB String)**: Submit `childName` atau `address` sepanjang 5000 karakter -> DENIED.
10. **Non-Admin Status Update**: User non-admin mencoba mengubah `status` di `/ppdb_registrations/reg-123` -> DENIED.
11. **Admin Unverified Email Spoof**: Token dengan `email: "wahyudidinar7@gmail.com"` tetapi `email_verified: false` mencoba akses admin -> DENIED.
12. **Arbitrary Quota Manipulation**: Pengunjung non-admin mencoba mengubah `capacity` atau mengatur `enrolledCount` menjadi `0` atau `-50` di `/ppdb_stats/kelompok_a` -> DENIED.

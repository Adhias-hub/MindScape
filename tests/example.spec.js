// @ts-check
import { test, expect } from '@playwright/test';

test('Tes Gembok v2 & Alur Aplikasi di iOS iPhone', async ({ page }) => {
  // 1. Buka langsung web MindSpace lu yang udah nangkring di Vercel!
  // (Ganti tautan di bawah ini pakai URL .vercel.app lu yang asli)
  await page.goto('https://mind-scape-lyart.vercel.app//');

  // 2. Cek apakah halaman login ke-render dengan sempurna di layar iPhone
  // Kita cek apakah ada tombol kirim login
  const btnLogin = page.locator('#btnKirimLogin');
  await expect(btnLogin).toBeVisible();

  // 3. Tes ketik data login gerilya lu di layar simulasi iPhone
  // (Sesuaikan id inputan jika di HTML lu berbeda)
  if (await page.locator('#loginEmail').isVisible()) {
    await page.locator('#loginEmail').fill('adhendhias@upi.edu'); // Contoh email lu
    await page.locator('#loginPassword').fill('passwordAmanUAS2026');
    
    // 4. Klik tombol login yang kemarin sempat lu takutin balapan/mogok di iOS
    await btnLogin.click();
    
    // 5. Mastiin setelah login sukses, system nge-redirect kita dengan selamat ke home.html
    await expect(page).toHaveURL(/.*home.html/);
    console.log('🤖 Robot Playwright: Login di iOS Safari Sukses, Kebal Mogok! 🎉');
  }
});
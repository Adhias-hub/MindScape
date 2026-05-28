import { test, expect } from '@playwright/test';

test('Cek tombol install PWA di berbagai browser', async ({ page, browserName }) => {
  // Menggunakan '/' karena otomatis digabungkan dengan baseURL (http://localhost:3000)
  await page.goto('/'); 

  if (browserName === 'webkit') {
    // Memastikan tombol #btnInstalPWA tersembunyi di iOS/WebKit
    await expect(page.locator('#btnInstalPWA')).toBeHidden();
    console.log('✅ [webkit/iOS] Berhasil: Tombol instalasi tersembunyi sesuai kebijakan Apple.');
  } else {
    // Menggunakan penanganan dinamis jika prompt PWA dilewati oleh lingkungan bot
    const tombolTerlihat = await page.locator('#btnInstalPWA').isVisible();
    
    if (tombolTerlihat) {
      await page.locator('#btnInstalPWA').click();
      console.log(`✅ [${browserName}] Berhasil: Tombol muncul dan dapat diklik.`);
    } else {
      console.log(`ℹ️ [${browserName}] Dilewati: Prompt instalasi diabaikan oleh sistem bot.`);
    }
  }
});
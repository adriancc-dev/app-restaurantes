import { test, expect } from '@playwright/test'

// Credentials from environment — never hardcode in source
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@example.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'Test1234!'

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('muestra el formulario de login por defecto', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible()
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
  })

  test('valida campos vacíos antes de enviar', async ({ page }) => {
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.getByText(/introduce un correo/i)).toBeVisible()
  })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('noexiste@email.com')
    await page.getByLabel(/contraseña/i).fill('wrongpassword')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('toggle de visibilidad de contraseña funciona', async ({ page }) => {
    const passwordInput = page.getByLabel(/contraseña/i)
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: /mostrar contraseña/i }).click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: /ocultar contraseña/i }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('navega a recuperar contraseña', async ({ page }) => {
    await page.getByRole('button', { name: /olvidaste tu contraseña/i }).click()
    await expect(page.getByRole('heading', { name: /recuperar contraseña/i })).toBeVisible()
  })

  test('bloquea tras 5 intentos fallidos', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/correo electrónico/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('wrongpass')
      await page.getByRole('button', { name: /entrar/i }).click()
      await page.waitForTimeout(300)
    }
    await expect(page.getByText(/demasiados intentos/i)).toBeVisible()
  })

  test('login correcto redirige según rol', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill(TEST_EMAIL)
    await page.getByLabel(/contraseña/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar/i }).click()
    // Should redirect to /home or /dashboard
    await expect(page).toHaveURL(/\/(home|dashboard)/)
  })
})

test.describe('Registro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Switch to register tab
    await page.getByRole('tab', { name: /registrar/i }).click().catch(() => {
      // Fallback if it's a button not a tab
      page.getByRole('button', { name: /crear cuenta/i }).click()
    })
  })

  test('muestra paso 1 del registro por defecto', async ({ page }) => {
    await expect(page.getByText(/datos personales/i)).toBeVisible()
    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
  })

  test('valida nombre completo con apellido', async ({ page }) => {
    await page.getByLabel(/nombre completo/i).fill('Juan')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByText(/al menos nombre y un apellido/i)).toBeVisible()
  })

  test('avanza al paso 2 con datos válidos', async ({ page }) => {
    await page.getByLabel(/nombre completo/i).fill('Juan Pérez García')
    // Phone input
    const phoneInput = page.locator('input[type="tel"], input[autocomplete="tel"]').first()
    await phoneInput.fill('612345678')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByText(/acceso/i)).toBeVisible()
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible()
  })

  test('indicador de fuerza de contraseña se actualiza', async ({ page }) => {
    await page.getByLabel(/nombre completo/i).fill('Juan Pérez García')
    const phoneInput = page.locator('input[autocomplete="tel"]').first()
    await phoneInput.fill('612345678')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.getByLabel(/^contraseña$/i).fill('weak')
    await expect(page.getByText(/muy débil|débil/i)).toBeVisible()
    await page.getByLabel(/^contraseña$/i).fill('StrongPass1!')
    await expect(page.getByText(/fuerte|muy fuerte/i)).toBeVisible()
  })

  test('requiere aceptar términos', async ({ page }) => {
    await page.getByLabel(/nombre completo/i).fill('Juan Pérez García')
    const phoneInput = page.locator('input[autocomplete="tel"]').first()
    await phoneInput.fill('612345678')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.getByLabel(/correo electrónico/i).fill(`test-${Date.now()}@test.com`)
    await page.getByLabel(/^contraseña$/i).fill('StrongPass1!')
    await page.getByLabel(/confirmar contraseña/i).fill('StrongPass1!')
    await page.getByRole('button', { name: /crear cuenta/i }).click()
    await expect(page.getByText(/debes aceptar/i)).toBeVisible()
  })
})

test.describe('Recuperar contraseña', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /olvidaste tu contraseña/i }).click()
  })

  test('muestra el formulario de recuperación', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /recuperar contraseña/i })).toBeVisible()
  })

  test('valida email antes de enviar', async ({ page }) => {
    await page.getByRole('button', { name: /enviar enlace/i }).click()
    await expect(page.getByText(/correo.*válido/i)).toBeVisible()
  })

  test('muestra mensaje de éxito tras enviar', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('alguien@test.com')
    await page.getByRole('button', { name: /enviar enlace/i }).click()
    await expect(page.getByText(/si existe una cuenta/i)).toBeVisible()
  })

  test('vuelve al login', async ({ page }) => {
    await page.getByRole('button', { name: /volver al inicio de sesión/i }).click()
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible()
  })
})

test.describe('Seguridad', () => {
  test('no filtra contraseñas en la URL', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel(/correo electrónico/i).fill('test@test.com')
    await page.getByLabel(/contraseña/i).fill('mypassword')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.url()).not.toContain('mypassword')
    await expect(page.url()).not.toContain('password')
  })

  test('el campo de contraseña es tipo password por defecto', async ({ page }) => {
    await page.goto('/')
    const passwordInput = page.getByLabel(/contraseña/i).first()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

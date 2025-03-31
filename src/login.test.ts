import { LoginAutomation } from './login';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../utils/iniciodesecion.env') });

jest.setTimeout(120000); // 120 segundos

test('Debería retornar true cuando se logra iniciar sesión', async () => {
    const automation = new LoginAutomation();

    try {
        await automation.launchBrowser();
        await automation.navigateToLoginPage(
            'https://sistemacuenca.ucp.edu.ar/alumnosnotas/Default.aspx?ReturnUrl=%2falumnosnotas%2fProteccion%2fInscripcionesExamenes.aspx%3fSel%3d2&Sel=2'
        );
        await automation.performLogin();
        await automation.validateLoginSuccess();

        // Si no lanza errores, el inicio de sesión fue exitoso
        expect(true).toBe(true);
    } finally {
        await automation.closeBrowser();
    }
});

test('Debería retornar true cuando se abre el panel de cursado después de iniciar sesión', async () => {
    const automation = new LoginAutomation();

    try {
        await automation.launchBrowser();
        await automation.navigateToLoginPage(
            'https://sistemacuenca.ucp.edu.ar/alumnosnotas/Default.aspx?ReturnUrl=%2falumnosnotas%2fProteccion%2fInscripcionesExamenes.aspx%3fSel%3d2&Sel=2'
        );
        await automation.performLogin();
        await automation.validateLoginSuccess();

        // Intentar abrir el panel de cursado
        const result = await automation.abrirPanelCursado('#ctl00_PanelCursado_header');

        // Validar que el resultado sea true
        expect(result).toBe(true);
    } catch (error) {
        console.error('Error en el test de abrir el panel de cursado:', error);
        throw error;
    } finally {
        await automation.closeBrowser();
    }
});

test('Debería retornar true cuando se navega a Inasistencias después de abrir el panel de cursado', async () => {
    const automation = new LoginAutomation();

    try {
        await automation.launchBrowser();
        await automation.navigateToLoginPage(
            'https://sistemacuenca.ucp.edu.ar/alumnosnotas/Default.aspx?ReturnUrl=%2falumnosnotas%2fProteccion%2fInscripcionesExamenes.aspx%3fSel%3d2&Sel=2'
        );
        await automation.performLogin();
        await automation.validateLoginSuccess();
        const result = await automation.abrirPanelCursado('a[href="Inasistencias.aspx?Sel=1"]');

        // Validar que el resultado sea true
        expect(result).toBe(true);
    } finally {
        await automation.closeBrowser();
    }
});
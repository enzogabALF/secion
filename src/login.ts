import { chromium, Browser, Page } from 'playwright';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env
const envPath = path.resolve(__dirname, 'utils/iniciodesecion.env');
console.log('Ruta del archivo .env:', envPath);
dotenv.config({ path: envPath });

// Debug: Verificar que las variables se cargaron
console.log('Variables cargadas:', {
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD ? '****' : undefined,
    'USERNAME length': process.env.USERNAME?.length,
    'PASSWORD length': process.env.PASSWORD?.length
});

// Debug: Verificar todas las variables de entorno
console.log('Todas las variables de entorno:', process.env);

export class LoginAutomation {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private username: string | undefined;
    private password: string | undefined;

    constructor() {
        this.username = process.env.USER;
        this.password = process.env.PASSWORD;

        // Verificar que las credenciales existan
        if (!this.username || !this.password) {
            throw new Error('Las credenciales no están definidas en el archivo .env');
        }
    }

    // Método para lanzar el navegador
    async launchBrowser(): Promise<void> {
        this.browser = await chromium.launch({
            headless: false,
            channel: 'chrome',
        });
        const context = await this.browser.newContext();
        this.page = await context.newPage();
    }

    // Método para cerrar el navegador
    async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }

    // Método para navegar a la página de inicio de sesión
    async navigateToLoginPage(url: string): Promise<void> {
        if (!this.page) {
            throw new Error('El navegador no está inicializado.');
        }
        await this.page.goto(url);
    }

    // Método para realizar el inicio de sesión
    async performLogin(): Promise<void> {
        if (!this.page) {
            throw new Error('La página no está inicializada.');
        }
        await this.page.fill('input[name="ctl00$ContentPlaceHolder1$TextBox1"]', this.username!);
        await this.page.fill('input[name="ctl00$ContentPlaceHolder1$Clave"]', this.password!);
        await this.page.click('input[id="ctl00_ContentPlaceHolder1_ImageButton1"]');
    }

    // Método para validar inicio de sesión exitoso
    async validateLoginSuccess(): Promise<void> {
        if (!this.page) {
            throw new Error('La página no está inicializada.');
        }
        const spanElement = await this.page.waitForSelector('#ctl00_Label1', { timeout: 50000 });
        const textContent = await spanElement?.textContent();

        if (textContent?.includes('Alfonso, Enzo Gabriel - Ingeniería en Sistemas de Información')) {
            console.log('Inicio de sesión exitoso: Usuario identificado correctamente.');
        } else {
            throw new Error('El texto del elemento no coincide con lo esperado.');
        }
    }

    // Método para validar inicio de sesión fallido
    async validateLoginFailure(): Promise<void> {
        if (!this.page) {
            throw new Error('La página no está inicializada.');
        }
        const errorMessageElement = await this.page.waitForSelector(
            '#ctl00_ContentPlaceHolder1_Label2',
            { timeout: 50000 }
        );
        const errorMessage = await errorMessageElement?.textContent();

        if (errorMessage?.includes('La combinación  de usuario y clave no coincide')) {
            console.log('No se logró iniciar sesión.');
        } else {
            throw new Error('El mensaje de error esperado no fue encontrado.');
        }
    }
}

// Ejecución del script para ambos escenarios
(async () => {
    const automation = new LoginAutomation();

    try {
        // Lanzar navegador y navegar a la página
        await automation.launchBrowser();
        await automation.navigateToLoginPage(
            'https://sistemacuenca.ucp.edu.ar/alumnosnotas/Default.aspx?ReturnUrl=%2falumnosnotas%2fProteccion%2fInscripcionesExamenes.aspx%3fSel%3d2&Sel=2'
        );

        // Escenario de inicio de sesión exitoso
        console.log('Probando inicio de sesión exitoso...');
        await automation.performLogin();
        await automation.validateLoginSuccess();

        // Esperar 5 segundos antes de cerrar
        console.log('Esperando 30 segundos antes de cerrar...');
        await new Promise(resolve => setTimeout(resolve, 30000));

     } catch (error) {
        console.error('Error durante la automatización:', error);
    } finally {
        await automation.closeBrowser();
    }
})();

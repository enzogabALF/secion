import { chromium, Browser, Page } from 'playwright';
import * as dotenv from 'dotenv';
import path from 'path';

// ===============================================
// Configuración de dotenv para cargar variables de entorno
// ===============================================
const envPath = path.resolve(__dirname, 'utils/iniciodesecion.env');
console.log('Ruta del archivo .env:', envPath);

dotenv.config({ path: envPath });

// Debug: Verificar que las variables de entorno se cargaron correctamente
console.log('Variables cargadas:', {
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD ? '****' : undefined,
});

// ===============================================
// Clase LoginAutomation para manejar el proceso de inicio de sesión
// ===============================================
export class LoginAutomation {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private username: string | undefined;
    private password: string | undefined;

    constructor() {
        this.username = process.env.USER; // Cargar USERNAME desde .env
        this.password = process.env.PASSWORD; // Cargar PASSWORD desde .env

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

        if (errorMessage?.includes('La combinación de usuario y clave no coincide')) {
            console.log('No se logró iniciar sesión.');
        } else {
            throw new Error('El mensaje de error esperado no fue encontrado.');
        }
    }

    // Método para abrir el panel de cursado y navegar a Inasistencias
    async abrirPanelCursado(panelElem: string): Promise<void> {
    if (!this.page) {
        throw new Error('La página no está inicializada.');
    }

    try {
        console.log('Intentando abrir el panel de cursado...');
        
        // Esperar a que la página esté completamente cargada
        await this.page.waitForLoadState('networkidle');

        const panelSelector = '#ctl00_PanelCursado_header';

        // Interactuar con el panel de cursado
        const panelElement = await this.page.waitForSelector(panelSelector, {
            state: 'visible',
            timeout: 5000,
        });

        if (panelElement) {
            await panelElement.click({ force: true });
            console.log('Panel de cursado clickeado exitosamente');

            // Esperar a que el panel se expanda
            await this.page.waitForTimeout(3000);

            // Navegar al enlace proporcionado
            await this.page.click(panelElem);
            console.log('Enlace de Inasistencias clickeado exitosamente');

            // Esperar a que la nueva página cargue completamente
            await this.page.waitForLoadState('networkidle');

            // Validar el texto dentro del ID especificado
            const updatePanelSelector = '#ctl00_ContentPlaceHolder1_UpdatePanel1';
            const updatePanelElement = await this.page.waitForSelector(updatePanelSelector, { timeout: 5000 });

            if (updatePanelElement) {
                const textContent = await updatePanelElement.textContent();

                if (textContent?.includes('Materias cursando en cuatrimestre actual')) {
                    console.log('Texto verificado: Materias cursando en cuatrimestre actual.');
                } else {
                    throw new Error('El texto esperado no se encuentra dentro del panel.');
                }
            } else {
                throw new Error(`No se pudo encontrar el panel con ID: ${updatePanelSelector}`);
            }
        } else {
            throw new Error('No se pudo encontrar el panel de cursado.');
        }
    } catch (error) {
        console.error('Error en el proceso:', error);
        throw error;
    }
}


    
}

// ===============================================
// Ejecución principal
// ===============================================
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
        await automation.abrirPanelCursado('a[href="Inasistencias.aspx?Sel=1"]');
        // Esperar antes de cerrar el navegador
        console.log('Esperando 30 segundos antes de cerrar...');
        await new Promise(resolve => setTimeout(resolve, 30000));
    } catch (error) {
        console.error('Error durante la automatización:', error);
    } finally {
        await automation.closeBrowser();
    }
})();

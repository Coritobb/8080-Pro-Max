class Coprocesador {

    constructor(cpu) {
        this.cpu = cpu;
    }

    leerNumero(direccion) {
        let memoria = new DataView(this.cpu.memory.buffer);
        return memoria.getFloat32(direccion, true);
    }

    guardarNumero(direccion, numero) {
        let memoria = new DataView(this.cpu.memory.buffer);
        memoria.setFloat32(direccion, numero, true);
    }

    ejecutar(operacion) {

        let numero1 = this.leerNumero(0xF000);
        let numero2 = this.leerNumero(0xF004);
        let resultado = 0;

        this.cpu.writeMemory(0xF00D, 1);

        if (operacion == 1) {
            resultado = numero1 + numero2;
        }

        if (operacion == 2) {
            resultado = numero1 - numero2;
        }

        if (operacion == 3) {
            resultado = numero1 * numero2;
        }

        if (operacion == 4) {

            if (numero2 == 0) {
                this.cpu.writeMemory(0xF00D, 3);
                return;
            }

            resultado = numero1 / numero2;
        }

        this.cpu.writeMemory(0xF00C, operacion);

        this.guardarNumero(0xF008, resultado);

        this.cpu.writeMemory(0xF00D, 2);
    }
}

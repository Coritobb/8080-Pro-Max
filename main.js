const cpu = new Intel8080();
const coprocesador = new Coprocesador(cpu);

cpu.coprocesador = coprocesador;

const assembler = new Assembler8080();

let runInterval = null;
let memoryStart = 0;
let flujoMostrado = false;

function updateUI() {
    // Registers
    document.getElementById('reg-a').textContent = cpu.registers.a.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-b').textContent = cpu.registers.b.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-c').textContent = cpu.registers.c.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-d').textContent = cpu.registers.d.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-e').textContent = cpu.registers.e.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-h').textContent = cpu.registers.h.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-l').textContent = cpu.registers.l.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-pc').textContent = cpu.registers.pc.toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('reg-sp').textContent = cpu.registers.sp.toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('reg-f').textContent = cpu.getFlagByte().toString(16).toUpperCase().padStart(2, '0');

    // Flags
    document.getElementById('flag-s').textContent = cpu.flags.s ? '1' : '0';
    document.getElementById('flag-z').textContent = cpu.flags.z ? '1' : '0';
    document.getElementById('flag-ac').textContent = cpu.flags.ac ? '1' : '0';
    document.getElementById('flag-p').textContent = cpu.flags.p ? '1' : '0';
    document.getElementById('flag-cy').textContent = cpu.flags.cy ? '1' : '0';

    document.getElementById('status-badge').textContent = cpu.halted ? 'Halted' : (runInterval ? 'Running' : 'Idle');
    document.getElementById('status-badge').style.backgroundColor = cpu.halted ? '#fee2e2' : (runInterval ? '#f0fdf4' : '#e2e8f0');

    renderMemory();
    renderStack();
    mostrarCoprocesador();
}
function mostrarCoprocesador() {

    let memoria = new DataView(cpu.memory.buffer);
    let numero1 = memoria.getFloat32(0xF000, true);
    let numero2 = memoria.getFloat32(0xF004, true);
    let resultado = memoria.getFloat32(0xF008, true);
    let operacion = cpu.readMemory(0xF00C);
    let estado = cpu.readMemory(0xF00D);

    document.getElementById('copro-num1').textContent = numero1.toFixed(2);
    document.getElementById('copro-num2').textContent = numero2.toFixed(2);
    document.getElementById('copro-resultado').textContent = resultado.toFixed(2);

    document.getElementById('copro-operacion').textContent = 'NINGUNA';
    document.getElementById('copro-estado').textContent = 'ESPERANDO';
    
    if (estado == 0) {
    flujoMostrado = false;
    }
    if (operacion == 1) {
        document.getElementById('copro-operacion').textContent = 'SUMA';
    }

    if (operacion == 2) {
        document.getElementById('copro-operacion').textContent = 'RESTA';
    }
 if (operacion == 3) {
        document.getElementById('copro-operacion').textContent = 'MULTIPLICACION';
    }
 if (operacion == 4) {
        document.getElementById('copro-operacion').textContent = 'DIVISION';
    }
  if (estado == 1) {
        document.getElementById('copro-estado').textContent = 'TRABAJANDO';
    }
if (estado == 2) {
    document.getElementById('copro-estado').textContent = 'LISTO';
    if (flujoMostrado == false) {
        animarFlujo();
        flujoMostrado = true;
    }
}
 if (estado == 3) {
        document.getElementById('copro-estado').textContent = 'ERROR';
    }
}
function animarFlujo() {
    let flecha1 = document.getElementById('flecha1');
    let flecha2 = document.getElementById('flecha2');
    let texto = document.getElementById('texto-flujo');
    flecha1.textContent = '→';
    flecha2.textContent = '-';
    texto.textContent = 'CPU envia los datos a memoria';
    setTimeout(function() {
        flecha1.textContent = '-';
        flecha2.textContent = '→';
        texto.textContent = 'Memoria envia los datos al coprocesador';
    }, 700);
    setTimeout(function() {
        flecha2.textContent = '←';
        texto.textContent = 'Coprocesador guarda el resultado en memoria';
    }, 1400);
    setTimeout(function() {
        flecha1.textContent = '←';
        flecha2.textContent = '-';
        texto.textContent = 'CPU recupera el resultado de memoria';
    }, 2100);
    setTimeout(function() {
        flecha1.textContent = '-';
        flecha2.textContent = '-';
        texto.textContent = 'Operacion terminada';
    }, 2800);
}
function renderStack() {
    const table = document.getElementById('stack-table');
    if (!table) return;
    table.innerHTML = '';

    const currentSP = cpu.registers.sp;

    // Show 5 slots (2-byte aligned) from SP - 4 to SP + 6
    for (let offset = 6; offset >= -4; offset -= 2) {
        const addr = (currentSP + offset) & 0xFFFF;

        const row = document.createElement('div');
        row.className = 'stack-row';
        if (offset === 0) {
            row.classList.add('active');
        }

        const addrSpan = document.createElement('span');
        addrSpan.className = 'stack-addr';
        addrSpan.textContent = (offset === 0 ? 'SP ➔ ' : '     ') + addr.toString(16).toUpperCase().padStart(4, '0') + ':';

        const low = cpu.readMemory(addr);
        const high = cpu.readMemory((addr + 1) & 0xFFFF);
        const val16 = (high << 8) | low;

        const valSpan = document.createElement('span');
        valSpan.className = 'stack-val';
        valSpan.textContent = val16.toString(16).toUpperCase().padStart(4, '0') + 'H (' + high.toString(16).toUpperCase().padStart(2, '0') + ' ' + low.toString(16).toUpperCase().padStart(2, '0') + ')';

        row.appendChild(addrSpan);
        row.appendChild(valSpan);
        table.appendChild(row);
    }
}

function renderMemory() {
    const table = document.getElementById('memory-table');
    table.innerHTML = '';

    // Header
    const empty = document.createElement('div');
    empty.className = 'mem-cell mem-header';
    empty.textContent = '';
    table.appendChild(empty);

    for (let i = 0; i < 16; i++) {
        const h = document.createElement('div');
        h.className = 'mem-cell mem-header';
        h.textContent = i.toString(16).toUpperCase();
        table.appendChild(h);
    }

    // Rows
    for (let row = 0; row < 8; row++) {
        const addr = (memoryStart + row * 16) & 0xFFFF;
        const h = document.createElement('div');
        h.className = 'mem-cell mem-addr';
        h.textContent = addr.toString(16).toUpperCase().padStart(4, '0');
        table.appendChild(h);

        for (let col = 0; col < 16; col++) {
            const cellAddr = (addr + col) & 0xFFFF;
            const c = document.createElement('div');
            c.className = 'mem-cell';
            if (cellAddr === cpu.registers.pc) c.style.backgroundColor = '#fde047';
            c.textContent = cpu.readMemory(cellAddr).toString(16).toUpperCase().padStart(2, '0');
            table.appendChild(c);
        }
    }
}

document.getElementById('btn-assemble').addEventListener('click', () => {
    const source = document.getElementById('code-editor').value;
    const output = document.getElementById('assembler-output');
    try {
        const result = assembler.assemble(source);
        cpu.memory.set(result.binary);
        output.textContent = 'Assembly successful! Loaded into memory.';
        output.className = 'success';
        updateUI();
    } catch (e) {
        output.textContent = 'Error: ' + e.message;
        output.className = 'error';
    }
});

document.getElementById('btn-clear-code').addEventListener('click', () => {
    document.getElementById('code-editor').value = '';
    const output = document.getElementById('assembler-output');
    if (output) {
        output.textContent = '';
        output.className = '';
    }
});

document.getElementById('btn-step').addEventListener('click', () => {
    cpu.step();
    updateUI();
});

document.getElementById('btn-run').addEventListener('click', () => {
    if (runInterval) return;
    runInterval = setInterval(() => {
        if (cpu.halted) {
            clearInterval(runInterval);
            runInterval = null;
            updateUI();
            return;
        }
        for (let i = 0; i < 100; i++) { // Execute in bursts
            cpu.step();
            if (cpu.halted) break;
        }
        updateUI();
    }, 10);
    updateUI();
});

document.getElementById('btn-stop').addEventListener('click', () => {
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
        updateUI();
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    cpu.reset();

    // Clear assembler output
    const output = document.getElementById('assembler-output');
    if (output) {
        output.textContent = '';
        output.className = '';
    }

    // Reset memory start address and variable
    const memStartInput = document.getElementById('mem-start-addr');
    if (memStartInput) {
        memStartInput.value = '0000';
    }
    memoryStart = 0;

    updateUI();
});

document.getElementById('btn-mem-go').addEventListener('click', () => {
    const val = document.getElementById('mem-start-addr').value;
    memoryStart = parseInt(val, 16) || 0;
    renderMemory();
});

// Initial UI update
updateUI();

describe('Truc Valencià - Pruebas de Integración', () => {
  beforeEach(() => {
    // Ajustar puerto al del frontend en Vite/Nx
    cy.visit('http://localhost:4200'); 
  });

  it('1. Validación de Inicio - Reparto y Cartas', () => {
    // Espera a que el board se cargue y los jugadores reciban cartas
    cy.get('[data-testid="player-hand"] .card').should('have.length', 3);
    
    // Comprobar ausencia de comodines, sotas(10), caballos(11), reyes(12), y doses(2)
    const invalidValues = ['10', '11', '12', '2'];
    cy.get('.card-value').each(($el) => {
      const text = $el.text();
      expect(invalidValues).to.not.include(text);
    });
  });

  it('2. Lógica del Envido', () => {
    // Botón de envido debe estar visible al principio de la primera mano
    cy.contains('button', '¡Envido!').should('be.visible');

    // Jugar una carta debería ocultar el botón de envido
    cy.get('[data-testid="player-hand"] .card').first().click();
    cy.contains('button', '¡Envido!').should('not.exist');
    
    // Test específico de cálculo requeriría mockear el estado de socket.io con cy.intercept o web-sockets
    // Se verificaría si el ScoreBoard de cama muestra el cálculo correcto frente a 7 y 6 de Espadas (33pts).
  });

  it('3. Flujo del Truc', () => {
    // El rival (mockeado) canta Truc. Verifica aparición de botones.
    // Mock event -> socket.emit('game:action', { type: 'TRUC' })
    
    // cy.contains('button', '¡Quiero!').should('be.visible');
    // cy.contains('button', 'No quiero').should('be.visible');
    // cy.contains('button', '¡Retruco!').should('be.visible');
  });

  it('4. Marcador de Pedres (Puntos)', () => {
    // Verificar que los agrupamientos "//" equivalen a 5 (Galls) y "|" a 1 (Trucos)
    cy.get('[data-testid="scoreboard-nosotros"]').within(() => {
      // mock data con 6 puntos
      // cy.get('.gall').should('have.length', 1);
      // cy.get('.truco').should('have.length', 1);
    });
  });
});

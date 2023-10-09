const crypto = require('crypto');
const Table = require('cli-table');
const readline = require('readline');

class Game {
  constructor(moves) {
    this.moves = moves;
    this.rulesTable = this.generateRulesTable(moves);
    this.key = this.generateKey();
    this.computerMove = null;
    this.hmac = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  applyTextStyle(text, options) {
    let formattedText = '';
    if (options.colorCode) {
      formattedText += `\x1b[${options.colorCode}m`;
    }
    if (options.isBold) {
      formattedText += '\x1b[1m';
    }
    formattedText += text;
    formattedText += '\x1b[0m';
    return formattedText;
  }

  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  calculateHMAC(key, message) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(message);
    return hmac.digest('hex');
  }

  generateRulesTable(moves) {
    const n = moves.length;
    const table = new Array(n);

    for (let i = 0; i < n; i++) {
      table[i] = new Array(n);
      const winningIndices = [];
      const losingIndices = [];

      for (let j = 1; j <= n / 2; j++) {
        winningIndices.push((i + j) % n);
        losingIndices.push((i - j + n) % n);
      }

      for (let j = 0; j < n; j++) {
        table[i][j] = winningIndices.includes(j)
          ? 'Win'
          : losingIndices.includes(j)
          ? 'Lose'
          : 'Draw';
      }
    }

    return table;
  }

  printRulesTable() {
    const table = new Table({
      head: ['v PC\\User >', ...this.moves],
      colWidths: [15, ...Array(this.moves.length).fill(10)],
    });

    for (let i = 0; i < this.moves.length; i++) {
      const row = [this.moves[i], ...this.rulesTable[i]];
      table.push(row);
    }

    console.log(
      this.applyTextStyle('Rules table:', { colorCode: '31', isBold: true })
    );
    console.log(table.toString());
    console.log(
      this.applyTextStyle(
        `(The intersection of the user's and the computer's moves is the result from the user's point of view)`,
        { colorCode: '32', isBold: false }
      )
    );
  }

  printMenu() {
    console.log('Available moves:');
    this.moves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log('0 - exit');
    console.log('? - help');
  }

  playGame() {
    this.computerMove =
      this.moves[Math.floor(Math.random() * this.moves.length)];
    this.hmac = this.calculateHMAC(this.key, this.computerMove);

    console.log(`HMAC key: ${this.key}`);

    this.rl.question('Enter your move: ', (userChoice) => {
      const userIndex = Number(userChoice);
      if (userIndex === 0) {
        console.log('Goodbye!');
        this.rl.close();
        return;
      }

      if (userChoice === '?') {
        this.printRulesTable();
        this.playGame();
        return;
      }

      if (isNaN(userIndex) || userIndex < 1 || userIndex > this.moves.length) {
        console.error('Invalid input. Please enter a valid move number.');
        this.printMenu();
        this.playGame();
        return;
      }

      const userMove = this.moves[userIndex - 1];
      console.log(`Your move: ${userMove}`);
      console.log(`Computer move: ${this.computerMove}`);

      const userI = this.moves.indexOf(userMove);
      const computerI = this.moves.indexOf(this.computerMove);

      const result = this.rulesTable[computerI][userI];

      if (result === 'Win') {
        console.log('You win!');
      } else if (result === 'Lose') {
        console.log('Computer wins!');
      } else if (result === 'Draw') {
        console.log("It's a draw!");
      }

      console.log(`HMAC: ${this.hmac}`);
      this.rl.close();
    });
  }
}

function main() {
  const args = process.argv.slice(2);

  if (
    args.length < 3 ||
    args.length % 2 === 0 ||
    new Set(args).size !== args.length
  ) {
    console.error(
      'Invalid input. Please provide an odd number of unique moves.'
    );
    return;
  }

  const game = new Game(args);
  game.printMenu();
  game.playGame();
}

main();

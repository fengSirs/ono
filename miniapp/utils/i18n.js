var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// miniapp/utils/i18n.ts
var i18n_exports = {};
__export(i18n_exports, {
  keys: () => keys,
  translate: () => translate
});
module.exports = __toCommonJS(i18n_exports);
var strings = {
  browserTitle: ["ONO! \u2014 Jogue com amigos", "ONO! \u2014 Play with friends", "ONO! \u2014 \u548C\u597D\u53CB\u4E00\u8D77\u73A9"],
  playHubTitle: ["Vamos jogar ONO!", "Let\u2019s play ONO!", "\u4E00\u8D77\u73A9 ONO\uFF01"],
  playHubHint: ["Jogue online agora ou entre numa sala de amigos.", "Play online now or join a friends room.", "\u5728\u7EBF\u5339\u914D\u968F\u65F6\u5F00\u73A9\uFF0C\u4E5F\u53EF\u4EE5\u521B\u5EFA\u6216\u52A0\u5165\u597D\u53CB\u623F\u95F4\u3002"],
  matchEntry: ["Jogar online", "Play online", "\u5728\u7EBF\u5339\u914D"],
  matchSizeTitle: ["Escolher participantes", "Choose player count", "\u9009\u62E9\u5339\u914D\u4EBA\u6570"],
  matchSizeHint: ["Total inclui voc\xEA \xB7 padr\xE3o 1v1", "Total includes you \xB7 default 1v1", "\u5305\u542B\u81EA\u5DF1\uFF0C\u9ED8\u8BA4 1v1"],
  matchDuel: ["2 pessoas \xB7 1v1", "2 players \xB7 1v1", "2 \u4EBA \xB7 1v1"],
  matchSizeLabel: ["{count} pessoas", "{count} players", "{count} \u4EBA"],
  matchQueueCount: ["{current}/{total} participantes na mesa", "{current}/{total} players joined", "\u5DF2\u5339\u914D {current}/{total} \u4EBA"],
  matchOpenSeat: ["Buscando\u2026", "Searching\u2026", "\u5339\u914D\u4E2D\u2026"],
  invalidMatchSize: ["Escolha 2, 3 ou 4 participantes.", "Choose 2, 3 or 4 players.", "\u8BF7\u9009\u62E9 2\u30013 \u6216 4 \u4EBA\u5BF9\u5C40\u3002"],
  navPlay: ["Jogar", "Play", "\u5F00\u59CB\u6E38\u620F"],
  navRules: ["Como jogar", "How to play", "\u73A9\u6CD5\u89C4\u5219"],
  navRooms: ["Sala de amigos", "Friends room", "\u597D\u53CB\u623F"],
  guest: ["Jogador", "Player", "\u73A9\u5BB6"],
  friendFree: ["Sala gr\xE1tis", "Free room", "\u514D\u8D39\u597D\u53CB\u623F"],
  tickets: ["cart\xF5es de sala", "room cards", "\u5F20\u623F\u5361"],
  edition: [
    "FEITO PARA JOGAR COM AMIGOS",
    "BRING YOUR PEOPLE TOGETHER",
    "\u597D\u670B\u53CB\uFF0C\u5C31\u8981\u4E00\u8D77\u73A9"
  ],
  heroA: ["A pr\xF3xima carta.", "The next card.", "\u4E0B\u4E00\u5F20\u724C\uFF0C"],
  heroB: ["A pr\xF3xima partida com amigos.", "The next good time.", "\u4E0B\u4E00\u573A\u6B22\u4E50\u3002"],
  heroDesc: [
    "Uma mesa, quatro cores e novas possibilidades. Jogue uma partida r\xE1pida ou convide seus amigos para jogar UNO.",
    "One table, four colors, endless twists. Play a quick round or get your friends together for a game of UNO.",
    "\u4E00\u5F20\u724C\u684C\uFF0C\u56DB\u79CD\u989C\u8272\uFF0C\u65E0\u9650\u53CD\u8F6C\u3002\u6765\u4E00\u573A\u8F7B\u677E\u5BF9\u5C40\uFF0C\u6216\u53EB\u4E0A\u597D\u53CB\u4E00\u8D77\u73A9 UNO\u3002"
  ],
  heroCta: ["Vamos jogar", "Let\u2019s play", "\u5F00\u73A9\u4E00\u5C40"],
  free: ["Gr\xE1tis para jogar", "Free to play", "\u514D\u8D39\u7545\u73A9"],
  noDownload: ["Sem baixar nada", "No download needed", "\u65E0\u9700\u4E0B\u8F7D"],
  tagline: [
    "A divers\xE3o est\xE1 na mesa.",
    "Good times are on the table.",
    "\u5FEB\u4E50\uFF0C\u5DF2\u7ECF\u4E0A\u684C\u3002"
  ],
  modeTitle: [
    "Como voc\xEA quer jogar hoje?",
    "How are we playing today?",
    "\u4ECA\u5929\uFF0C\u600E\u4E48\u73A9\uFF1F"
  ],
  modeDesc: [
    "Escolha como jogar e participe de uma partida.",
    "Pick your table. We\u2019ll bring the good times.",
    "\u9009\u62E9\u4F60\u7684\u724C\u684C\uFF0C\u8BA9\u6B22\u4E50\u5373\u523B\u5F00\u59CB\u3002"
  ],
  botTag: ["DO SEU JEITO", "AT YOUR OWN PACE", "\u8F7B\u677E\u7EC3\u4E60"],
  botTitle: ["Treine com bots", "Play with bots", "\u673A\u5668\u4EBA\u5BF9\u6218"],
  botDesc: [
    "Aque\xE7a o jogo, teste suas estrat\xE9gias e jogue sem esperar por ningu\xE9m.",
    "Warm up, try a new strategy, and play without waiting for anyone.",
    "\u968F\u65F6\u5F00\u5C40\uFF0C\u78E8\u70BC\u6280\u5DE7\uFF0C\u4E0E\u4E09\u4E2A\u673A\u5668\u4EBA\u8F7B\u677E\u5207\u78CB\u3002"
  ],
  botMeta: ["Voc\xEA + 3 bots", "You + 3 bots", "\u4F60 + 3 \u4E2A\u673A\u5668\u4EBA"],
  botBtn: ["Jogar agora", "Play now", "\u7ACB\u5373\u5F00\u73A9"],
  onlineTag: ["JOGUE ONLINE", "PLAY ONLINE", "\u5728\u7EBF\u5339\u914D"],
  onlineTitle: ["Jogar online", "Play online", "\u5728\u7EBF\u73A9\u5BB6\u5BF9\u6218"],
  onlineDesc: [
    "Escolha o n\xFAmero de participantes e encontre uma partida.",
    "Choose your player count and find a match.",
    "\u9009\u62E9\u5BF9\u5C40\u4EBA\u6570\uFF0C\u5F00\u59CB\u5339\u914D\u3002"
  ],
  onlineMeta: [
    "2 jogadores \xB7 ao vivo",
    "2 players \xB7 live",
    "2 \u4EBA\u5BF9\u6218 \xB7 \u5B9E\u65F6\u540C\u6B65"
  ],
  onlineBtn: ["Buscar partida", "Find a match", "\u5F00\u59CB\u5339\u914D"],
  roomTag: ["S\xD3 PARA SEUS AMIGOS", "JUST YOUR FRIENDS", "\u597D\u53CB\u4E13\u5C5E"],
  roomTitle: ["Junte os amigos", "Bring your friends", "\u597D\u53CB\u623F\u5361\u6A21\u5F0F"],
  roomDesc: [
    "Crie uma sala, compartilhe o c\xF3digo e jogue com seus amigos.",
    "Create a room, share the code, and let the good times begin.",
    "\u521B\u5EFA\u4E13\u5C5E\u623F\u95F4\uFF0C\u5206\u4EAB\u623F\u95F4\u7801\uFF0C\u548C\u670B\u53CB\u4E00\u8D77\u5FEB\u4E50\u51FA\u724C\u3002"
  ],
  roomMeta: [
    "2\u20134 jogadores \xB7 sala privada",
    "2\u20134 players \xB7 private room",
    "2\u20134 \u4EBA \xB7 \u79C1\u5BC6\u623F\u95F4"
  ],
  roomBtn: ["Criar sala", "Create room", "\u521B\u5EFA\u623F\u95F4"],
  join: ["Entrar com c\xF3digo", "Join with a code", "\u8F93\u5165\u623F\u95F4\u7801\u52A0\u5165"],
  joinShort: ["Entrar na sala", "Join room", "\u52A0\u5165\u623F\u95F4"],
  littleTitle: [
    "Poucas regras. Muitas reviravoltas.",
    "Simple rules. Endless twists.",
    "\u7B80\u5355\u89C4\u5219\uFF0C\u65E0\u9650\u53CD\u8F6C\u3002"
  ],
  littleDesc: [
    "Combine a cor ou o n\xFAmero e use as cartas especiais. Antes de jogar e ficar com uma carta, toque em UNO.",
    "Match the color or number. Use action cards. And with one card left\u2026 call UNO!",
    "\u5339\u914D\u989C\u8272\u6216\u6570\u5B57\uFF0C\u5DE7\u7528\u529F\u80FD\u724C\u3002\u53EA\u5269\u6700\u540E\u4E00\u5F20\u65F6\uFF0C\u522B\u5FD8\u4E86\u558A UNO\uFF01"
  ],
  seeRules: ["Ver regras", "See the rules", "\u67E5\u770B\u89C4\u5219"],
  footer: [
    "Feito para jogar junto.",
    "Made to play together.",
    "\u4E3A\u4E00\u8D77\u73A9\u800C\u751F\u3002"
  ],
  unofficial: [
    "Projeto independente de f\xE3s \xB7 Sem v\xEDnculo com a Mattel",
    "Independent fan project \xB7 Not affiliated with Mattel",
    "\u72EC\u7ACB\u7231\u597D\u8005\u9879\u76EE \xB7 \u4E0E Mattel \u65E0\u5173\u8054"
  ],
  roomCardInfo: ["Crie e entre em salas de amigos gratuitamente.", "Create and join friends rooms for free.", "\u597D\u53CB\u623F\u95F4\u514D\u8D39\u521B\u5EFA\u3001\u514D\u8D39\u52A0\u5165\u3002"],
  profile: ["Seu nome na mesa", "Your name at the table", "\u4F60\u7684\u724C\u684C\u6635\u79F0"],
  namePlaceholder: [
    "Qual \xE9 o seu apelido?",
    "What should we call you?",
    "\u670B\u53CB\u4EEC\u600E\u4E48\u79F0\u547C\u4F60\uFF1F"
  ],
  save: ["Salvar", "Save", "\u4FDD\u5B58"],
  cancel: ["Cancelar", "Cancel", "\u53D6\u6D88"],
  close: ["Fechar", "Close", "\u5173\u95ED"],
  back: ["Voltar ao in\xEDcio", "Back to lobby", "\u8FD4\u56DE\u5927\u5385"],
  createTitle: [
    "A mesa \xE9 sua.",
    "Create a room for friends.",
    "\u4F60\u7684\u623F\u95F4\uFF0C\u4F60\u505A\u4E3B\u3002"
  ],
  createDesc: ["Crie uma sala gratuita e convide seus amigos. Todos recebem pontos ao concluir cada rodada.", "Create a free room and invite friends. Everyone earns points for each completed round.", "\u514D\u8D39\u521B\u5EFA\u623F\u95F4\uFF0C\u9080\u8BF7\u597D\u53CB\u3002\u6BCF\u8F6E\u5B8C\u6574\u5BF9\u5C40\u540E\uFF0C\u6240\u6709\u53C2\u4E0E\u8005\u90FD\u80FD\u83B7\u5F97\u6D3B\u52A8\u79EF\u5206\u3002"],
  players: ["Jogadores", "Players", "\u73A9\u5BB6\u4EBA\u6570"],
  rounds: ["Rodadas", "Rounds", "\u5BF9\u5C40\u8F6E\u6570"],
  createCta: ["Criar sala gr\xE1tis", "Create free room", "\u514D\u8D39\u521B\u5EFA\u623F\u95F4"],
  joinTitle: [
    "Seus amigos est\xE3o esperando.",
    "Your friends are waiting.",
    "\u597D\u53CB\u6B63\u5728\u7B49\u4F60\u3002"
  ],
  codeLabel: ["C\xF3digo de 6 d\xEDgitos", "6-digit room code", "6 \u4F4D\u6570\u5B57\u623F\u95F4\u7801"],
  waitingTitle: [
    "Aguardando os participantes",
    "Waiting for players",
    "\u597D\u53CB\u96C6\u7ED3\u4E2D\uFF01"
  ],
  waitingDesc: [
    "Copie o link abaixo e envie para seus amigos.",
    "Copy the link below and send it to your friends.",
    "\u590D\u5236\u4E0B\u65B9\u9080\u8BF7\u94FE\u63A5\uFF0C\u53D1\u7ED9\u597D\u53CB\u4E00\u8D77\u73A9\u3002"
  ],
  copy: ["Copiar convite", "Copy invite", "\u590D\u5236\u9080\u8BF7"],
  copied: ["Convite copiado!", "Invite copied!", "\u9080\u8BF7\u5DF2\u590D\u5236\uFF01"],
  inviteTitle: ["Chame seus amigos para jogar!", "Invite friends to play!", "\u9080\u8BF7\u597D\u53CB\uFF0C\u4E00\u8D77\u5F00\u5C40\uFF01"],
  inviteStepCopy: ["Copie o link", "Copy the link", "\u590D\u5236\u94FE\u63A5"],
  inviteStepSend: ["Envie no Phiz ou grupo", "Send in Phiz or a group", "\u53D1\u5230 Phiz \u6216\u7FA4\u804A"],
  inviteStepJoin: ["Amigos entram pelo link", "Friends join via the link", "\u597D\u53CB\u70B9\u94FE\u63A5\u52A0\u5165"],
  inviteCopyLink: ["Copiar link e convidar amigos", "Copy link to invite friends", "\u590D\u5236\u9080\u8BF7\u94FE\u63A5\uFF0C\u53D1\u7ED9\u597D\u53CB"],
  inviteCopied: ["Link copiado!", "Link copied!", "\u9080\u8BF7\u94FE\u63A5\u5DF2\u590D\u5236\uFF01"],
  inviteHelp: ["O link j\xE1 leva o c\xF3digo da sala. Qualquer participante pode convidar.", "The link includes the room code. Everyone in the room can invite friends.", "\u94FE\u63A5\u5DF2\u5305\u542B\u623F\u95F4\u7801\uFF0C\u623F\u4E3B\u548C\u53C2\u4E0E\u8005\u90FD\u53EF\u4EE5\u9080\u8BF7\u597D\u53CB\u3002"],
  inviteSendNow: ["Agora abra o Phiz ou seu grupo e cole o link na conversa.", "Now open Phiz or your group and paste the link into the chat.", "\u73B0\u5728\u6253\u5F00 Phiz \u6216\u7FA4\u804A\uFF0C\u7C98\u8D34\u94FE\u63A5\u53D1\u9001\u7ED9\u597D\u53CB\u3002"],
  inviteManualCopy: ["N\xE3o foi poss\xEDvel copiar automaticamente. Toque e segure o link abaixo para copiar e enviar.", "Automatic copying is unavailable. Long-press the link below to copy and send it.", "\u81EA\u52A8\u590D\u5236\u672A\u6210\u529F\uFF0C\u8BF7\u957F\u6309\u4E0B\u65B9\u94FE\u63A5\u590D\u5236\uFF0C\u518D\u53D1\u9001\u7ED9\u597D\u53CB\u3002"],
  inviteLinkLabel: ["Link da sala \xB7 tamb\xE9m pode copiar manualmente", "Room link \xB7 you can also copy it manually", "\u623F\u95F4\u9080\u8BF7\u94FE\u63A5 \xB7 \u4E5F\u53EF\u957F\u6309\u624B\u52A8\u590D\u5236"],
  host: ["Anfitri\xE3o", "Host", "\u623F\u4E3B"],
  you: ["Voc\xEA", "You", "\u4F60"],
  emptySeat: ["Lugar reservado", "Open seat", "\u7B49\u5F85\u52A0\u5165"],
  start: ["Come\xE7ar partida", "Start game", "\u5F00\u59CB\u6E38\u620F"],
  waitHost: [
    "Aguardando o anfitri\xE3o come\xE7ar\u2026",
    "Waiting for the host to start\u2026",
    "\u7B49\u5F85\u623F\u4E3B\u5F00\u59CB\u6E38\u620F\u2026"
  ],
  needPlayers: [
    "Precisa de pelo menos 2 jogadores.",
    "At least 2 players are needed.",
    "\u81F3\u5C11\u9700\u8981 2 \u540D\u73A9\u5BB6\u3002"
  ],
  findTitle: [
    "Encontrando jogadores\u2026",
    "Finding players\u2026",
    "\u6B63\u5728\u5339\u914D\u73A9\u5BB6\u2026"
  ],
  findDesc: [
    "Preparando a sua mesa para o n\xFAmero de participantes escolhido.",
    "Preparing a table for your selected player count.",
    "\u6B63\u5728\u4E3A\u4F60\u5B89\u6392\u6240\u9009\u4EBA\u6570\u7684\u5BF9\u5C40\u3002"
  ],
  findHint: [
    "A partida come\xE7a automaticamente quando a mesa estiver pronta.",
    "Your game starts automatically when the table is ready.",
    "\u51C6\u5907\u5C31\u7EEA\u540E\u81EA\u52A8\u5F00\u5C40\uFF0C\u65E0\u9700\u91CD\u65B0\u64CD\u4F5C\u3002"
  ],
  elapsed: ["Tempo de espera", "Time waiting", "\u5DF2\u7B49\u5F85"],
  leave: ["Sair da mesa", "Leave table", "\u79BB\u5F00\u724C\u684C"],
  leaveTitle: ["Vai sair da partida?", "Leave this game?", "\u786E\u5B9A\u79BB\u5F00\u5BF9\u5C40\uFF1F"],
  leaveDesc: [
    "Ao sair, esta partida ser\xE1 encerrada para todos.",
    "Leaving will end this game for everyone.",
    "\u79BB\u5F00\u540E\uFF0C\u672C\u573A\u5BF9\u5C40\u5C06\u5BF9\u6240\u6709\u73A9\u5BB6\u7ED3\u675F\u3002"
  ],
  leaveCta: ["Sair da partida", "Leave game", "\u786E\u8BA4\u79BB\u5F00"],
  stay: ["Continuar jogando", "Keep playing", "\u7EE7\u7EED\u6E38\u620F"],
  practice: ["MESA DE TREINO", "PRACTICE TABLE", "\u7EC3\u4E60\u724C\u684C"],
  online: ["PARTIDA ONLINE", "ONLINE MATCH", "\u5728\u7EBF\u5BF9\u6218"],
  private: ["SALA DE AMIGOS", "FRIENDS ROOM", "\u597D\u53CB\u623F\u95F4"],
  round: ["Rodada", "Round", "\u7B2C"],
  turnYou: [
    "\xC9 a sua vez de jogar.",
    "Your turn. Make your move!",
    "\u8F6E\u5230\u4F60\u4E86\uFF0C\u51FA\u724C\u5427\uFF01"
  ],
  turnOther: ["Vez de", "Turn:", "\u5F53\u524D\u56DE\u5408\uFF1A"],
  draw: ["Comprar carta", "Draw a card", "\u6478\u4E00\u5F20\u724C"],
  pass: ["Passar a vez", "Pass turn", "\u8DF3\u8FC7\u56DE\u5408"],
  unoHint: [
    "Antes de ficar com 1 carta, aperte UNO!",
    "Before you\u2019re down to 1 card, tap UNO!",
    "\u51FA\u724C\u540E\u4EC5\u5269 1 \u5F20\u65F6\uFF0C\u8BF7\u5148\u70B9 UNO\uFF01"
  ],
  unoArmed: ["UNO ativado!", "UNO declared!", "\u5DF2\u58F0\u660E UNO\uFF01"],
  cards: ["cartas", "cards", "\u5F20\u724C"],
  drawHint: ["Toque para comprar", "Tap to draw", "\u70B9\u51FB\u6478\u724C"],
  color: ["Cor da vez", "Current color", "\u5F53\u524D\u989C\u8272"],
  red: ["Vermelho", "Red", "\u7EA2\u8272"],
  yellow: ["Amarelo", "Yellow", "\u9EC4\u8272"],
  green: ["Verde", "Green", "\u7EFF\u8272"],
  blue: ["Azul", "Blue", "\u84DD\u8272"],
  chooseColor: ["Qual vai ser a cor?", "Pick the next color", "\u9009\u62E9\u4E0B\u4E00\u4E2A\u989C\u8272"],
  chooseBatchColorDesc: [
    "Escolha uma das cores das cartas selecionadas. A pr\xF3xima jogada continua nessa cor.",
    "Choose a color from the selected cards. The next player continues with that color.",
    "\u9009\u62E9\u672C\u6B21\u51FA\u724C\u5305\u542B\u7684\u4E00\u79CD\u989C\u8272\uFF0C\u4E0B\u4E00\u4F4D\u73A9\u5BB6\u5C06\u6309\u8FD9\u4E2A\u989C\u8272\u7EE7\u7EED\u51FA\u724C\u3002"
  ],
  invalidBatchColor: [
    "Escolha uma cor presente nas cartas que voc\xEA est\xE1 jogando.",
    "Choose a color included in the cards you are playing.",
    "\u53EA\u80FD\u9009\u62E9\u672C\u6B21\u6240\u51FA\u624B\u724C\u5305\u542B\u7684\u989C\u8272\u3002"
  ],
  chooseDesc: [
    "Mude a cor. Mude o jogo.",
    "Change the color. Change the game.",
    "\u6539\u53D8\u989C\u8272\uFF0C\u6539\u53D8\u5C40\u52BF\u3002"
  ],
  drawnHint: [
    "Selecione a carta comprada e toque em Jogar. Pode juntar n\xFAmeros iguais.",
    "Select the drawn card and tap Play. You can add matching numbers.",
    "\u9009\u4E2D\u521A\u6478\u5230\u7684\u724C\uFF0C\u518D\u70B9\u51FB\u300C\u51FA\u724C\u300D\uFF0C\u4E5F\u53EF\u8FFD\u52A0\u540C\u6570\u5B57\u724C\u3002"
  ],
  matchEnded: [
    "A mesa foi encerrada.",
    "This game has ended.",
    "\u672C\u573A\u5BF9\u5C40\u5DF2\u7ED3\u675F\u3002"
  ],
  abandoned: [
    "Um jogador saiu da partida. Volte ao in\xEDcio para jogar de novo.",
    "A player left the game. Head to the lobby to play again.",
    "\u6709\u73A9\u5BB6\u79BB\u5F00\u5BF9\u5C40\uFF0C\u8FD4\u56DE\u5927\u5385\u5373\u53EF\u518D\u6B21\u5F00\u73A9\u3002"
  ],
  win: [
    "Voc\xEA venceu esta rodada!",
    "You won the round!",
    "\u6F02\u4EAE\uFF01\u4F60\u8D62\u5F97\u4E86\u672C\u8F6E\uFF01"
  ],
  winnerTitle: ["venceu a rodada!", "won the round!", "\u8D62\u5F97\u4E86\u672C\u8F6E\uFF01"],
  finalTitle: ["Fim de jogo!", "Game over!", "\u5BF9\u5C40\u7ED3\u675F\uFF01"],
  nextRound: ["Pr\xF3xima rodada", "Next round", "\u4E0B\u4E00\u8F6E"],
  playAgain: ["Jogar de novo", "Play again", "\u518D\u6765\u4E00\u5C40"],
  score: ["Pontos UNO", "UNO score", "UNO \u724C\u5206"],
  ruleTitle: ["Vamos aprender?", "Ready to learn?", "\u4E00\u5206\u949F\uFF0C\u5B66\u4F1A\u5F00\u73A9\u3002"],
  ruleIntro: [
    "Seja o primeiro a jogar todas as suas cartas para vencer a rodada.",
    "Be the first to play all your cards to win the round.",
    "\u7387\u5148\u51FA\u5B8C\u624B\u724C\uFF0C\u5373\u53EF\u8D62\u5F97\u672C\u8F6E\u3002"
  ],
  rule1Title: ["Combine e jogue", "Match and play", "\u5339\u914D\u51FA\u724C"],
  rule1: [
    "Cada jogador come\xE7a com 7 cartas. Combine a cor, n\xFAmero ou s\xEDmbolo. Voc\xEA pode selecionar mais cartas do mesmo n\xFAmero, inclusive de outras cores. Selecione as cartas e toque no bot\xE3o Jogar ao lado de UNO. Se as cartas tiverem cores diferentes, escolha uma delas antes de confirmar a jogada. Cartas especiais s\xE3o jogadas individualmente.",
    "Everyone starts with 7 cards. Match the color, number, or symbol. You may select more cards of the same number, even in different colors. Select your cards and tap the Play button next to UNO. When the cards have different colors, choose one of those colors before submitting. Play action cards individually.",
    "\u6BCF\u4EBA\u521D\u59CB 7 \u5F20\u724C\u3002\u9996\u5F20\u9700\u4E0E\u684C\u9762\u724C\u989C\u8272\u3001\u6570\u5B57\u6216\u7B26\u53F7\u5339\u914D\uFF1B\u53EF\u8FFD\u52A0\u76F8\u540C\u6570\u5B57\u7684\u724C\uFF0C\u5141\u8BB8\u540C\u8272\u91CD\u590D\u548C\u8DE8\u8272\u8FDE\u51FA\uFF0C\u9009\u597D\u724C\u540E\u70B9\u51FB UNO \u65C1\u7684\u300C\u51FA\u724C\u300D\u6309\u94AE\u5373\u53EF\u4E00\u8D77\u6253\u51FA\uFF0C\u591A\u79CD\u989C\u8272\u4E00\u8D77\u51FA\u65F6\uFF0C\u53EF\u9009\u62E9\u672C\u6B21\u51FA\u724C\u5305\u542B\u7684\u989C\u8272\u4F5C\u4E3A\u540E\u7EED\u989C\u8272\u3002\u529F\u80FD\u724C\u5355\u5F20\u4F7F\u7528\u3002"
  ],
  rule2Title: [
    "Compre at\xE9 poder jogar.",
    "Draw until you can play.",
    "\u8FDE\u7EED\u6478\u5230\u53EF\u51FA\u7684\u724C\u3002"
  ],
  rule2: [
    "Toque em comprar para puxar cartas at\xE9 encontrar uma que possa jogar. Selecione essa carta e, se for um n\xFAmero, adicione cartas do mesmo n\xFAmero. Voc\xEA tamb\xE9m pode passar. Ap\xF3s 30 segundos, o jogo compra e passa automaticamente.",
    "Tap draw to keep drawing until a playable card appears. Select it and optionally add cards of the same number, or pass. After 30 seconds, the game draws and passes automatically.",
    "\u70B9\u51FB\u6478\u724C\u540E\u4F1A\u8FDE\u7EED\u6478\u5230\u4E00\u5F20\u53EF\u51FA\u7684\u724C\uFF0C\u518D\u9009\u62E9\u8BE5\u724C\u51FA\u724C\uFF1B\u82E5\u662F\u6570\u5B57\u724C\uFF0C\u4E5F\u53EF\u8FFD\u52A0\u624B\u4E2D\u540C\u6570\u5B57\u724C\uFF0C\u6216\u9009\u62E9\u8DF3\u8FC7\u300230 \u79D2\u672A\u64CD\u4F5C\u4F1A\u81EA\u52A8\u8FDE\u7EED\u6478\u724C\u5E76\u8DF3\u8FC7\uFF1B\u724C\u5E93\u8017\u5C3D\u4E14\u65E0\u6CD5\u56DE\u6536\u65F6\u4E5F\u4F1A\u8DF3\u8FC7\u3002"
  ],
  rule3Title: ["Vire o jogo", "Turn it around", "\u529F\u80FD\u724C\u626D\u8F6C\u5C40\u52BF"],
  rule3: [
    "\u2298 pula o pr\xF3ximo; \u21C4 inverte o sentido; +2 faz o pr\xF3ximo comprar 2 e perder a vez. O curinga escolhe a cor. +4 s\xF3 pode ser usado sem cartas da cor atual.",
    "\u2298 skips the next player; \u21C4 reverses direction; +2 makes the next player draw 2 and skip. Wilds choose a color. +4 is legal only when you have no card of the current color.",
    "\u2298 \u8DF3\u8FC7\u4E0B\u5BB6\uFF1B\u21C4 \u53CD\u8F6C\u65B9\u5411\uFF1B+2 \u4F7F\u4E0B\u5BB6\u6478 2 \u5F20\u5E76\u8DF3\u8FC7\u3002\u4E07\u80FD\u724C\u53EF\u9009\u989C\u8272\uFF1B+4 \u4EC5\u5728\u6CA1\u6709\u5F53\u524D\u989C\u8272\u7684\u724C\u65F6\u53EF\u51FA\u3002"
  ],
  rule4Title: ["N\xE3o esque\xE7a o UNO!", "Don\u2019t forget UNO!", "\u522B\u5FD8\u4E86\u558A UNO\uFF01"],
  rule4: [
    "Se as cartas selecionadas deixarem s\xF3 uma na m\xE3o, aperte UNO antes de jogar. Esqueceu? Compre 2 cartas de penalidade.",
    "If your selected cards leave one card in hand, tap UNO before submitting them. Forget and you draw 2 penalty cards.",
    "\u5355\u5F20\u6216\u591A\u5F20\u51FA\u724C\u540E\u5C06\u53EA\u5269 1 \u5F20\u724C\u65F6\uFF0C\u8BF7\u5148\u70B9 UNO\uFF1B\u5FD8\u8BB0\u58F0\u660E\u4F1A\u7F5A\u6478 2 \u5F20\u3002"
  ],
  ruleNote: [
    "Sem empilhar +2/+4 e sem desafio de +4. Em 2 jogadores, inverter tamb\xE9m pula o advers\xE1rio. O placar da mesa usa rodadas vencidas; empates dividem a posi\xE7\xE3o. Pontos da campanha entram no saldo \xFAnico.",
    "No stacking +2/+4 or +4 challenges. With 2 players, reverse also skips the opponent. Table standings use rounds won, with shared positions for ties. Campaign rewards enter your single points wallet.",
    "+2/+4 \u4E0D\u53E0\u52A0\uFF0C\u4E0D\u542B +4 \u8D28\u7591\uFF1B\u4E24\u4EBA\u5C40\u53CD\u8F6C\u7B49\u540C\u8DF3\u8FC7\u3002\u684C\u5185\u6309\u83B7\u80DC\u8F6E\u6570\u6392\u540D\uFF0C\u540C\u80DC\u573A\u5E76\u5217\uFF1B\u6D3B\u52A8\u5956\u52B1\u8FDB\u5165\u7EDF\u4E00\u79EF\u5206\u94B1\u5305\u3002"
  ],
  audioSettings: ["Som da partida", "Game sound", "\u6E38\u620F\u97F3\u6548"],
  audioIntro: ["D\xEA vida \xE0s cartas e \xE0s vit\xF3rias. Toque nos bot\xF5es para experimentar.", "Bring cards and victories to life. Tap a sound to try it.", "\u8BA9\u6BCF\u6B21\u51FA\u724C\u548C\u80DC\u5229\u66F4\u6709\u611F\u89C9\uFF0C\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u8BD5\u542C\u3002"],
  soundEffects: ["Efeitos sonoros", "Sound effects", "\u5F00\u542F\u97F3\u6548"],
  audioPlaying: ["Tocando\u2026", "Playing\u2026", "\u8BD5\u542C\u4E2D\u2026"],
  audioUnavailable: ["O som n\xE3o est\xE1 dispon\xEDvel agora. Voc\xEA pode continuar jogando e tentar novamente depois.", "Sound is unavailable right now. You can keep playing and try again later.", "\u6682\u65F6\u65E0\u6CD5\u64AD\u653E\u97F3\u6548\uFF0C\u4F60\u53EF\u4EE5\u7EE7\u7EED\u6E38\u620F\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002"],
  audioVolume: ["Volume", "Volume", "\u97F3\u91CF"],
  audioDone: ["Pronto", "Done", "\u5B8C\u6210"],
  previewplay: ["Jogar carta", "Play card", "\u51FA\u724C\u58F0"],
  previewdraw: ["Comprar carta", "Draw card", "\u6478\u724C\u58F0"],
  previewuno: ["UNO!", "UNO!", "UNO \u63D0\u793A"],
  previewwin: ["Vit\xF3ria", "Victory", "\u80DC\u5229\u58F0"],
  sortHand: ["Organizar cartas", "Sort hand", "\u6574\u7406\u624B\u724C"],
  soundOn: ["Som ligado", "Sound on", "\u97F3\u6548\u5DF2\u5F00\u542F"],
  soundOff: ["Som desligado", "Sound off", "\u97F3\u6548\u5DF2\u5173\u95ED"],
  loading: ["S\xF3 um instante\u2026", "Just a moment\u2026", "\u8BF7\u7A0D\u5019\u2026"],
  reconnecting: ["Reconectando\u2026", "Reconnecting\u2026", "\u6B63\u5728\u91CD\u8FDE\u2026"],
  retry: ["Tente novamente.", "Please try again.", "\u8BF7\u91CD\u8BD5\u3002"],
  sessionExpired: [
    "Sua sess\xE3o expirou. Recarregue a p\xE1gina.",
    "Session expired. Reload this page.",
    "\u4F1A\u8BDD\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u3002"
  ],
  serviceUnavailable: [
    "N\xE3o foi poss\xEDvel conectar. Tente novamente.",
    "Couldn\u2019t connect. Please try again.",
    "\u6682\u65F6\u65E0\u6CD5\u8FDE\u63A5\uFF0C\u8BF7\u91CD\u8BD5\u3002"
  ],
  roomMissing: [
    "Sala n\xE3o encontrada ou expirada.",
    "Room not found or expired.",
    "\u623F\u95F4\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F\u3002"
  ],
  roomFull: ["Essa mesa est\xE1 cheia.", "This table is full.", "\u623F\u95F4\u5DF2\u6EE1\u3002"],
  invalidCode: [
    "Digite os 6 d\xEDgitos do c\xF3digo.",
    "Enter a 6-digit room code.",
    "\u8BF7\u8F93\u5165 6 \u4F4D\u6570\u5B57\u623F\u95F4\u7801\u3002"
  ],
  alreadyStarted: [
    "Essa partida j\xE1 come\xE7ou.",
    "This game has already started.",
    "\u5BF9\u5C40\u5DF2\u7ECF\u5F00\u59CB\u3002"
  ],
  noTickets: ["Salas de amigos s\xE3o gratuitas.", "Friends rooms are free.", "\u597D\u53CB\u623F\u95F4\u514D\u8D39\u5F00\u653E\u3002"],
  notTurn: [
    "Espere sua vez.",
    "Please wait for your turn.",
    "\u8BF7\u7B49\u5F85\u4F60\u7684\u56DE\u5408\u3002"
  ],
  invalidCard: [
    "Essa carta n\xE3o combina com a mesa.",
    "That card doesn\u2019t match.",
    "\u8FD9\u5F20\u724C\u4E0D\u7B26\u5408\u51FA\u724C\u89C4\u5219\u3002"
  ],
  staleTurn: [
    "A mesa mudou. Atualizando\u2026",
    "The table changed. Refreshing\u2026",
    "\u724C\u684C\u5DF2\u66F4\u65B0\uFF0C\u6B63\u5728\u540C\u6B65\u2026"
  ],
  hostOnly: [
    "S\xF3 o anfitri\xE3o pode fazer isso.",
    "Only the host can do that.",
    "\u4EC5\u623F\u4E3B\u53EF\u64CD\u4F5C\u3002"
  ],
  notMember: [
    "Voc\xEA n\xE3o est\xE1 nesta sala.",
    "You are not in this room.",
    "\u4F60\u4E0D\u5728\u6B64\u623F\u95F4\u4E2D\u3002"
  ],
  notPlaying: [
    "Essa rodada n\xE3o est\xE1 em andamento.",
    "This round is not active.",
    "\u672C\u8F6E\u4E0D\u5728\u8FDB\u884C\u4E2D\u3002"
  ],
  alreadyDrawn: [
    "Voc\xEA j\xE1 comprou uma carta.",
    "You already drew a card.",
    "\u672C\u56DE\u5408\u5DF2\u6478\u724C\u3002"
  ],
  mustDraw: [
    "Compre uma carta primeiro.",
    "Draw a card first.",
    "\u8BF7\u5148\u6478\u4E00\u5F20\u724C\u3002"
  ],
  invalidAction: [
    "A\xE7\xE3o inv\xE1lida. Tente novamente.",
    "Invalid action. Try again.",
    "\u64CD\u4F5C\u65E0\u6548\uFF0C\u8BF7\u91CD\u8BD5\u3002"
  ],
  nameRequired: ["Escolha um nome.", "Please choose a name.", "\u8BF7\u8F93\u5165\u6635\u79F0\u3002"],
  roundStart: ["A rodada come\xE7ou!", "The round has started!", "\u65B0\u4E00\u8F6E\u5F00\u59CB\uFF01"],
  drew: ["comprou uma carta", "drew a card", "\u6478\u4E86\u4E00\u5F20\u724C"],
  played: ["jogou", "played", "\u6253\u51FA\u4E86"],
  unoPenalty: ["esqueceu o UNO: +2", "forgot UNO: +2", "\u5FD8\u558A UNO\uFF0C\u7F5A\u6478 2 \u5F20"],
  calledUno: ["declarou UNO!", "called UNO!", "\u558A\u4E86 UNO\uFF01"],
  penalty: ["comprou", "drew", "\u88AB\u7F5A\u6478"],
  won: ["venceu!", "won!", "\u83B7\u80DC\uFF01"],
  connection: ["Conectado", "Connected", "\u5DF2\u8FDE\u63A5"],
  yourHand: ["Suas cartas", "Your hand", "\u4F60\u7684\u624B\u724C"],
  roomsLink: ["J\xE1 tem um c\xF3digo?", "Already have a code?", "\u5DF2\u7ECF\u6709\u623F\u95F4\u7801\uFF1F"],
  roomCost: ["Criar e entrar \xE9 gr\xE1tis \xB7 mais amigos, mais pontos", "Free to create and join \xB7 more friends, more points", "\u514D\u8D39\u521B\u5EFA\u548C\u52A0\u5165 \xB7 \u597D\u53CB\u8D8A\u591A\uFF0C\u79EF\u5206\u8D8A\u591A"],
  practiceLevel: [
    "3 bots \xB7 regras cl\xE1ssicas",
    "3 bots \xB7 classic rules",
    "3 \u4E2A\u673A\u5668\u4EBA \xB7 \u7ECF\u5178\u89C4\u5219"
  ],
  modeLabel: ["ESCOLHA SEU MODO", "PICK YOUR MODE", "\u9009\u62E9\u73A9\u6CD5"],
  getReady: [
    "Sua pr\xF3xima partida come\xE7a aqui.",
    "Your next game starts here.",
    "\u4E0B\u4E00\u573A\u6B22\u4E50\uFF0C\u4ECE\u8FD9\u91CC\u5F00\u59CB\u3002"
  ],
  copyFallback: [
    "Copie o c\xF3digo acima.",
    "Copy the code above.",
    "\u8BF7\u590D\u5236\u4E0A\u65B9\u623F\u95F4\u7801\u3002"
  ],
  roomClosed: ["Sala encerrada", "Room closed", "\u623F\u95F4\u5DF2\u5173\u95ED"],
  rateLimited: [
    "Muitas a\xE7\xF5es em pouco tempo. Aguarde um minuto e tente novamente.",
    "Too many actions. Wait a minute and try again.",
    "\u64CD\u4F5C\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u7B49\u4E00\u5206\u949F\u540E\u91CD\u8BD5\u3002"
  ],
  chooseNickname: ["Seu apelido", "Set nickname", "\u8BBE\u7F6E\u6635\u79F0"],
  nicknameHint: [
    "Escolha um apelido para seus amigos reconhecerem voc\xEA. Ele aparece na sala, na mesa e no placar.",
    "Choose a nickname your friends will recognize. It appears in rooms, at the table, and on the scoreboard.",
    "\u8BBE\u7F6E\u4E00\u4E2A\u670B\u53CB\u80FD\u8BA4\u51FA\u4F60\u7684\u6635\u79F0\uFF0C\u623F\u95F4\u3001\u724C\u684C\u548C\u79EF\u5206\u699C\u90FD\u4F1A\u663E\u793A\u3002"
  ],
  nicknameLength: [
    "De 2 a 20 caracteres \xB7 pode alterar no topo",
    "2\u201320 characters \xB7 edit any time in the header",
    "2\u201320 \u4E2A\u5B57\u7B26\uFF0C\u53EF\u968F\u65F6\u70B9\u51FB\u53F3\u4E0A\u89D2\u4FEE\u6539"
  ],
  selectHint: [
    "Selecione as cartas e toque em Jogar.",
    "Select cards, then tap Play.",
    "\u9009\u597D\u624B\u724C\u540E\uFF0C\u70B9\u51FB\u300C\u51FA\u724C\u300D\u3002"
  ],
  selectedCount: [
    "{count} selecionada(s)",
    "{count} selected",
    "\u5DF2\u9009 {count} \u5F20"
  ],
  playCards: ["Jogar", "Play", "\u51FA\u724C"],
  clearSelection: ["Limpar", "Clear", "\u53D6\u6D88\u9009\u62E9"],
  nextColor: ["Pr\xF3xima cor", "Next color", "\u4E0B\u5BB6\u989C\u8272"],
  chooseAfter: ["Escolher ao jogar", "Choose when playing", "\u51FA\u724C\u65F6\u9009\u62E9"],
  drawUntil: ["Comprar at\xE9 jogar", "Draw until playable", "\u8FDE\u7EED\u6478\u724C"],
  drewMany: [
    "comprou {count} cartas",
    "drew {count} cards",
    "\u8FDE\u7EED\u6478\u4E86 {count} \u5F20\u724C"
  ],
  playedMany: [
    "jogou {count} cartas juntas",
    "played {count} cards together",
    "\u4E00\u6B21\u6253\u51FA\u4E86 {count} \u5F20\u724C"
  ],
  invalidBatch: [
    "Jogue juntas apenas cartas do mesmo n\xFAmero.",
    "Only cards with the same number can be played together.",
    "\u8FDE\u51FA\u7684\u724C\u5FC5\u987B\u662F\u76F8\u540C\u6570\u5B57\u3002"
  ],
  turnAlert: ["\xC9 a sua vez!", "Your turn to play!", "\u5230\u4F60\u51FA\u724C\u4E86\uFF01"],
  turnAlertHint: [
    "Selecione suas cartas \xB7 voc\xEA tem 30 segundos",
    "Select your cards \xB7 you have 30 seconds",
    "\u8BF7\u9009\u62E9\u624B\u724C\uFF0C\u4F60\u6709 30 \u79D2\u64CD\u4F5C\u65F6\u95F4"
  ],
  wild: ["Curinga", "Wild", "\u4E07\u80FD\u724C"],
  skip: ["Bloqueio", "Skip", "\u8DF3\u8FC7"],
  reverse: ["Inverter", "Reverse", "\u53CD\u8F6C"],
  friendsFirst: ["Jogue com amigos", "Play with friends", "\u548C\u597D\u53CB\u4E00\u8D77\u73A9"],
  friendsHint: ["Convide amigos: todos ganham pontos, sem depender de vit\xF3ria.", "Invite friends: everyone earns points, win or lose.", "\u9080\u8BF7\u597D\u53CB\u4E00\u8D77\u73A9\uFF0C\u8F93\u8D62\u90FD\u80FD\u83B7\u5F97\u79EF\u5206\u3002"],
  rankTie: ["Empate!", "It\u2019s a tie!", "\u5E73\u5C40\uFF01"]
};
function translate(lang, key) {
  const v = strings[key];
  return v ? v[lang === "pt" ? 0 : lang === "en" ? 1 : 2] : key;
}
var keys = Object.keys(strings);

const base = require("./i18n");
const farm = require("./christmas-i18n");
const extra = {
  compactExtras: ["Cenários e histórico", "Scenes and history", "装扮与记录"],
  compactFinished: ["Crescimento completo", "Fully grown", "已养成"],
  compactRulesHint: ["Apenas a primeira conclusão participa. Um prêmio por pessoa.", "Only your first completion counts. One prize per person.", "仅首次养满参榜，每人限领一次"],

  compactBoard: ["Desafio do Peru da Semana", "Weekly Turkey Challenge", "本周火鸡挑战"],
  christmasTag: ["Natal ONO!", "ONO! Christmas", "ONO! 圣诞限定"],
  firstSpot: ["Quem chega primeiro?", "Be the first", "首位等你"],
  fullBadge: ["Semana lotada", "All spots taken", "本周名额已满"],
  leaderBadge: ["1º · {name}", "#1 · {name}", "第 1 名 · {name}"],
  ownBadge: ["Minha posição: {rank}º", "My rank: #{rank}", "我的第 {rank} 名"],
  oldBadge: ["{week} · {rank}º", "{week} · #{rank}", "{week} 当周第 {rank} 名"],
  challengeHint: ["Os primeiros 100 a criar o peru por completo nesta semana podem resgatar o prêmio.", "The first 100 to fully grow their turkey this week can claim a prize.", "本周最先养满的 100 人，可以领取火鸡。"],
  winnerHint: ["Você foi a {rank}ª pessoa a completar o desafio nesta semana!", "You were finisher #{rank} this week!", "你是本周第 {rank} 位养满的玩家！"],
  growButton: ["Cuidar do meu peru", "Care for my turkey", "去养火鸡"],
  seeFinishers: ["Ver quem já conseguiu", "See who made it", "看看谁上榜了"],
  seeBoard: ["Ver ranking da semana", "View this week’s rankings", "查看本周榜单"],
  myRankButton: ["Ver minha posição", "View my rank", "查看我的排名"],
  claimTurkey: ["Resgatar meu peru", "Claim my turkey", "领取我的火鸡"],
  compactFarm: ["Meu peru", "My turkey", "我的火鸡"],
  compactClaim: ["Resgatar prêmio", "Claim prize", "领取火鸡"],
  compactBoardHint: ["Os primeiros 100 a crescer ganham", "First 100 to finish growth qualify", "每周前 100 位养满可领奖"],
  compactRemaining: ["Vagas restantes", "Places left", "剩余名额"],
  compactRank: ["Posição {rank}", "Rank {rank}", "第 {rank} 名"],
  compactOwnWeek: ["Semana de {week}", "Week of {week}", "上榜周 {week}"],
  compactQualified: ["Você já pode resgatar seu prêmio.", "Your prize is ready to claim.", "已获资格，可以领奖了"],
  compactUnfinished: ["Complete o crescimento para entrar no ranking.", "Finish growing to enter the leaderboard.", "养满即可参榜"],
  compactMissed: ["Fora dos 100 primeiros. Sem prêmio nesta campanha.", "Outside the first 100. No prize this campaign.", "未进前 100 名，本次无领奖资格"],
  compactFull: ["Semana lotada. Concluir agora não dá prêmio. Guarde o progresso para concluir em outra semana.", "This week is full. Finishing now will not win. Keep your progress to finish in another week.", "本周已满，现在养满不能领奖。可保留进度，下周再完成。"],
  compactRegistered: ["Pedido enviado. Aguarde a análise.", "Claim sent. Awaiting review.", "已登记，等待审核"],
  compactReview: ["Conclusão em verificação. Fale com a equipe.", "Completion under review. Contact the team.", "达成记录待核验，请联系活动团队"],
  compactRules: ["Regras", "Rules", "活动规则"],
  compactHideRules: ["Ocultar regras", "Hide rules", "收起规则"],
  compactEmpty: ["Seja o primeiro a completar!", "Be the first to finish!", "还没人养满，争取第一个"],
  compactName: ["Jogador", "Player", "玩家"],
  compactTime: ["Conclusão", "Finished", "达成时间"],
  compactFeed: ["Alimentar", "Feed", "喂养"],
  compactExchange: ["Trocar ração", "Get feed", "兑换饲料"],
  compactMore: ["Mais", "More", "更多"],
  compactHideMore: ["Ocultar", "Show less", "收起"],
  compactStart: ["Receba seu ovo para começar", "Claim your egg to start", "领一颗蛋，开始养成"],
  compactPrize: ["Seu prêmio", "Your prize", "火鸡奖品"],
  compactClaimHint: ["Entrega após análise do pedido.", "Delivery follows claim review.", "登记后审核发放"],
  compactClaimClosed: ["O prazo de resgate terminou.", "The claim period has ended.", "申领已截止"],
  compactMyClaim: ["Meu pedido", "My claim", "我的申领"],
  featureComingSoon: ["Em breve", "Coming soon", "功能暂未开放"],

  weeklyTitle: ["Ranking semanal", "Weekly leaderboard", "每周达成榜"],
  weeklyEntry: ["Ver ranking semanal", "View weekly leaderboard", "查看每周排行榜"],
  weeklyRule: ["Os primeiros 100 a completar o crescimento em cada semana podem solicitar o prêmio imediatamente. Cada pessoa participa apenas na primeira conclusão e pode ganhar uma vez na campanha.", "The first 100 to complete growth each week can claim immediately. Each person enters only on their first completion and can win once during the campaign.", "每周最先完成养成的 100 人立即获得申领资格。每人仅首次养满时参榜，整个活动最多获奖一次。"],
  weeklyBoardTitle: ["Ranking da semana", "Weekly ranking", "本周火鸡挑战"],
  weeklyDeadline: ["Crescimento até 24/12 · 23:59", "Grow by Dec 24 · 23:59", "养满截止 12 月 24 日 23:59"],
  weeklySchedule: ["Segunda 00:00 até domingo 23:59:59. O progresso é mantido.", "Monday 00:00 through Sunday 23:59:59. Growth progress is kept.", "每周一 00:00 至周日 23:59:59，跨周保留养成进度。"],
  weeklyRemaining: ["Vagas restantes: {count}/100", "Remaining places: {count}/100", "本周剩余名额：{count}/100"],
  weeklyCompleted: ["{count} participantes concluíram nesta semana", "{count} participants completed this week", "本周已有 {count} 人达成"],
  weeklyMyRank: ["Sua posição: {rank} · semana de {week}", "Your rank: {rank} · week of {week}", "我的名次：第 {rank} 名 · {week} 当周"],
  weeklyQualified: ["Você está entre os 100 primeiros e já pode solicitar o prêmio. Sua vaga continua válida após o fim da semana, até o prazo da campanha.", "You are in the first 100 and can claim now. Your place remains valid after the week closes, until the campaign claim deadline.", "你已进入当周前 100 名，可立即申领。资格在跨周后保留，须在活动申领截止前登记。"],
  weeklyNotQualified: ["Sua primeira conclusão ficou fora dos 100 primeiros da semana. Ela não participa novamente nas próximas semanas.", "Your first completion was outside the week’s first 100. It will not enter again in future weeks.", "你首次达成时未进入当周前 100 名，后续周榜不会重新参赛。"],
  weeklyNotFinished: ["Complete o crescimento para registrar sua primeira conclusão nesta semana.", "Complete growth to record your first completion this week.", "养成达到 100% 后，记录首次达成的当周名次。"],
  weeklyFull: ["As 100 vagas desta semana foram preenchidas. Completar agora não dá direito ao prêmio. Você pode guardar seu progresso e concluir em uma próxima semana ativa.", "All 100 places this week are filled. Completing now will not qualify for a prize. You can keep your progress and finish in a later active week.", "本周 100 个名额已满，现在养满将无法获奖。进度会保留，可在后续活动周完成养成。"],
  rankingReview: ["Sua conclusão anterior precisa ser verificada pela equipe. Fale com o suporte.", "Your earlier completion needs team verification. Contact support.", "历史达成时间待核验，请联系活动团队。"],
  weeklyClaimRegistered: ["Seu pedido já foi registrado. Acompanhe a análise e a entrega.", "Your claim is already registered. Track review and fulfilment.", "你已登记申领，可查看审核和发放状态。"],
  weeklyEmpty: ["Nenhuma conclusão registrada nesta semana.", "No completions recorded this week.", "本周暂无达成记录。"],
  weeklyClosed: ["Semana encerrada", "Week closed", "本周已封榜"],
  weeklyActive: ["Em andamento", "In progress", "进行中"],
  weeklyCountdownLabel: ["Encerra em", "Closes in", "距封榜"],
  weeklyDayUnit: ["{days}d ", "{days}d ", "{days} 天 "],
  weeklyThisWeek: ["Esta semana", "This week", "本周"],
  weeklyStartHint: ["Adote seu perno e alimente {goal} porções para entrar no ranking desta semana.", "Claim your turkey and feed {goal} portions to enter this week's ranking.", "先领养火鸡，养满 {goal} 份即可进入本周排名。"],
  weeklyPrevious: ["Semana anterior", "Previous week", "上一周"],
  weeklyNext: ["Próxima semana", "Next week", "下一周"],
  weeklyCurrent: ["Semana atual", "Current week", "回到本周"],
  weeklyHeaders: ["Posição / Participante / Conclusão", "Rank / Participant / Completion", "名次 / 用户 / 达成时间"],
  weeklyMe: ["Você", "You", "我"],
  weeklyPrivacy: ["Apenas apelidos e horários de conclusão são exibidos.", "Only nicknames and completion times are shown.", "仅展示昵称和达成时间。"],
  weeklyClaim: ["Solicitar prêmio", "Claim prize", "领取火鸡奖品"],
  weeklyJoinTitle: ["Participe desta semana", "Join this week", "参与本周挑战"],
  weeklyJoinHint: ["Alimente {goal} porções para registrar sua conclusão e entrar no ranking.", "Feed {goal} portions to record your completion and enter the ranking.", "养满 {goal} 份即可记录达成并进入本周排名。"],
  weeklyGuestHint: ["Digite seu apelido para participar da campanha.", "Enter your nickname to join the campaign.", "输入昵称即可参与活动。"],
  weeklySignIn: ["Entrar e participar", "Sign in to join", "登录并参与"],
  weeklyGrownHint: ["Seu peru está pronto. Veja sua posição e o status do prêmio.", "Your turkey is ready. See your rank and prize status.", "火鸡已养满，可查看名次和奖励状态。"],
  invalidWeek: ["Semana inválida.", "Invalid week.", "周榜日期无效。"],

  authNotConfigured: ["O acesso pelo Phiz está em preparação. Tente novamente mais tarde.", "Phiz sign-in is being prepared. Please try again later.", "Phiz 登录暂未开放，请稍后再试。"],
  back: ["Voltar", "Back", "返回"],
  nickname: ["Seu apelido", "Your nickname", "你的昵称"],
  saveName: ["Salvar nome", "Save nickname", "保存昵称"],
  nameHelp: [
    "Use de 2 a 20 caracteres.",
    "Use 2–20 characters.",
    "请输入 2–20 个字符。",
  ],
  farmEntry: ["Meu filhote de Natal", "My Christmas turkey", "我的圣诞火鸡"],
  createRoom: ["Criar sala", "Create room", "创建房间"],
  joinRoom: ["Entrar na sala", "Join room", "加入房间"],
  roomNumber: ["Número da sala", "Room number", "房间号"],
  playerCount: ["Participantes", "Players", "人数"],
  roundCount: ["Rodadas", "Rounds", "轮数"],
  startGame: ["Começar partida", "Start game", "开始对局"],
  leaveRoom: ["Sair da sala", "Leave room", "离开房间"],
  confirmLeave: [
    "Sair pode encerrar esta rodada. Continuar?",
    "Leaving may end this round. Continue?",
    "离开可能结束本轮，确定离开？",
  ],
  inviteCard: ["Convidar no Phiz", "Invite on Phiz", "分享小程序卡片邀请"],
  cardPreparing: [
    "Preparando convite…",
    "Preparing invitation…",
    "正在准备邀请卡片…",
  ],
  cardRetry: ["Preparar convite novamente", "Retry invitation", "重新准备邀请"],
  cardHint: [
    "Envie o cartão a um amigo ou grupo no Phiz. Quem tocar nele entra nesta sala.",
    "Send this mini-program card to a friend or group on Phiz. Tapping it opens this room.",
    "把小程序卡片发给 Phiz 好友或群聊，点击卡片即可进入此房间。",
  ],
  cardTitle: [
    "ONO! • Sala {code} • Vamos jogar?",
    "ONO! • Room {code} • Join my table",
    "ONO! · 房间 {code} · 一起玩牌",
  ],
  cardDesc: [
    "Sala grátis para {count} pessoas.",
    "Free room for {count} players.",
    "{count} 人免费好友房",
  ],
  inviteWelcome: ["Você foi convidado!", "You’re invited!", "好友邀请你加入"],
  inviteJoin: ["Entrar nesta sala", "Join this room", "加入这个房间"],
  inviteExpired: [
    "Este convite expirou. Peça um novo cartão.",
    "This invitation expired. Ask for a new card.",
    "邀请已过期，请让好友重新发送卡片。",
  ],
  inviteInvalid: ["Convite inválido.", "Invalid invitation.", "邀请无效。"],
  alreadyInRoom: [
    "Você já está em outra mesa. Volte a ela antes de entrar.",
    "You are already at another table. Return to it before joining.",
    "你正在其他房间中，请先返回或退出原房间。",
  ],
  lobby: ["Início", "Lobby", "大厅"],
  resume: ["Voltar à minha mesa", "Resume my table", "返回我的牌桌"],
  cancel: ["Cancelar", "Cancel", "取消"],
  close: ["Fechar", "Close", "关闭"],
  confirm: ["Confirmar", "Confirm", "确定"],
  retry: ["Tentar novamente", "Retry", "重试"],
  loading: ["Carregando…", "Loading…", "加载中…"],
  matchTitle: ["Encontrando jogadores…", "Finding players…", "正在匹配玩家…"],
  matchHint: [
    "A partida começa quando a mesa estiver pronta.",
    "Your game starts when the table is ready.",
    "牌桌准备好后自动开局。",
  ],
  waitingHost: [
    "Aguardando o anfitrião…",
    "Waiting for the host…",
    "等待房主开始…",
  ],
  host: ["Anfitrião", "Host", "房主"],
  you: ["Você", "You", "你"],
  cards: ["cartas", "cards", "张牌"],
  round: ["Rodada", "Round", "轮次"],
  turn: ["Sua vez!", "Your turn!", "到你出牌了！"],
  waitTurn: ["Aguarde sua vez", "Wait for your turn", "等待其他玩家出牌"],
  play: ["Jogar", "Play", "出牌"],
  draw: ["Comprar até jogar", "Draw until playable", "摸到可出为止"],
  pass: ["Passar", "Pass", "过牌"],
  sort: ["Organizar", "Sort", "整理"],
  clear: ["Limpar", "Clear", "清空选择"],
  nextRound: ["Próxima rodada", "Next round", "下一轮"],
  finished: ["Partida encerrada", "Round complete", "本轮结束"],
  wins: ["vitórias", "wins", "获胜轮数"],
  toFarm: ["Alimentar o filhote", "Feed my turkey", "去喂养火鸡"],
  selected: [
    "{count} cartas selecionadas",
    "{count} cards selected",
    "已选 {count} 张",
  ],
  chooseColor: [
    "Escolha a próxima cor",
    "Choose the next color",
    "选择接下来的颜色",
  ],
  red: ["Vermelho", "Red", "红色"],
  yellow: ["Amarelo", "Yellow", "黄色"],
  green: ["Verde", "Green", "绿色"],
  blue: ["Azul", "Blue", "蓝色"],
  reward: [
    "Pontos creditados: {count}",
    "Points credited: {count}",
    "本轮到账积分：{count}",
  ],
  noReward: [
    "Partidas online não geram pontos da campanha.",
    "Online games do not award campaign points.",
    "在线匹配不产生活动积分。",
  ],
  rulesTitle: ["Como jogar ONO!", "How to play ONO!", "ONO! 玩法"],
  rulesBody: [
    "Combine a cor, o número ou o símbolo da carta da mesa. Você pode jogar várias cartas do mesmo número; ao combinar cores, escolha uma delas para a próxima jogada. Toque em Jogar para confirmar. Compre até encontrar uma carta válida. Antes de jogar e ficar com apenas uma carta, toque em UNO. Cartas especiais são jogadas individualmente e podem pular a vez, inverter o sentido ou fazer comprar cartas.",
    "Match the color, number or symbol of the top card. You can play multiple cards of the same number; if their colors differ, choose one for the next play. Tap Play to submit. Draw until you find a playable card. Tap UNO before a play that leaves one card in your hand. Play action cards individually; they can skip a turn, reverse direction or make a player draw cards.",
    "匹配桌面牌的颜色、数字或符号。可选择相同数字的多张牌，点击出牌；跨颜色连出时选择本次包含的颜色。连续摸到可出的牌。本次出牌后将只剩一张手牌时，请先点 UNO。功能牌单张使用，可跳过回合、反转方向或让玩家摸牌。",
  ],
  taskDetails: [
    "Explique quando e como concluiu a tarefa",
    "Describe when and how you completed the task",
    "填写完成时间及说明",
  ],
  chooseProof: [
    "Adicionar comprovantes",
    "Add evidence photos",
    "添加凭证图片",
  ],
  proofCount: ["{count}/3 imagens", "{count}/3 photos", "{count}/3 张图片"],
  sendProof: ["Enviar para análise", "Submit for review", "提交审核"],
  proofConsent: [
    "Confirmo que as imagens mostram minha própria tarefa e autorizo a análise.",
    "These images show my own task and I consent to review.",
    "凭证为本人任务记录，同意用于本次人工审核。",
  ],
  imageTooLarge: [
    "Use uma imagem JPEG/PNG de até 200 KB.",
    "Use a JPEG/PNG image up to 200 KB.",
    "请选择不超过 200 KB 的 JPEG/PNG 图片。",
  ],
  taskSuccess: [
    "Comprovantes enviados para análise.",
    "Evidence submitted for review.",
    "凭证已提交，等待审核。",
  ],
  sound: ["Som", "Sound", "音效"],
  soundOn: ["Som ligado", "Sound on", "音效已开启"],
  soundOff: ["Som desligado", "Sound off", "音效已关闭"],
  networkError: [
    "Falha de conexão. Tente novamente.",
    "Connection failed. Please retry.",
    "连接失败，请重试。",
  ],
  guestDisabled: [
    "Configure o login Phiz para este ambiente.",
    "Configure Phiz login for this environment.",
    "请为此环境配置 Phiz 登录。",
  ],
  loginFailed: [
    "Não foi possível entrar no Phiz.",
    "Phiz sign-in failed.",
    "Phiz 登录失败。",
  ],
  loginCodeUsed: [
    "Faça o login novamente.",
    "Please sign in again.",
    "请重新登录。",
  ],
  sessionExpired: [
    "Sua sessão expirou. Entre novamente.",
    "Your session expired. Sign in again.",
    "登录已过期，请重新登录。",
  ],
  hostShareMissing: [
    "O compartilhamento deve ser ativado no app Phiz.",
    "Sharing must be enabled in the Phiz host app.",
    "请在 Phiz 宿主中接入卡片分享。",
  ],
  unsupportedApi: [
    "Atualize o aplicativo para usar este recurso.",
    "Update the host app to use this feature.",
    "请更新宿主 App 后使用此功能。",
  ],
  domainNotAllowed: [
    "O domínio da API não está liberado no FinClip.",
    "The API domain is not allowed by FinClip.",
    "API 域名没有被 FinClip 放行。",
  ],
  insecureRequest: [
    "O app não permite HTTP para este endereço.",
    "The app does not allow HTTP for this address.",
    "宿主 App 不允许请求这个 HTTP 地址。",
  ],
};
function interpolate(s, values) {
  Object.keys(values || {}).forEach(function (k) {
    s = s.split("{" + k + "}").join(String(values[k]));
  });
  return s;
}
function t(lang, key, values) {
  var i = lang === "pt" ? 0 : lang === "en" ? 1 : 2;
  if (extra[key]) return interpolate(extra[key][i], values);
  var s = base.translate(lang, key);
  if (s === key) s = farm.ct(lang, key, values);
  return interpolate(s, values);
}
function labels(lang) {
  var a = {};
  base.keys.concat(Object.keys(extra)).forEach(function (k) {
    a[k] = t(lang, k);
  });
  var c = {};
  farm.keys.forEach(function (k) {
    c[k] = farm.ct(lang, k);
  });
  return { t: a, c: c, lang: lang };
}
module.exports = { t: t, labels: labels, extra: extra };

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

// miniapp/utils/christmas-i18n.ts
var christmas_i18n_exports = {};
__export(christmas_i18n_exports, {
  ct: () => ct,
  keys: () => keys
});
module.exports = __toCommonJS(christmas_i18n_exports);
var words = {
  taskRefresh: ["Atualizar an\xE1lise", "Refresh review status", "\u5237\u65B0\u5BA1\u6838\u72B6\u6001"],
  taskNoUno: ["Tarefas Phiz \u2192 ra\xE7\xE3o direta, sem jogar UNO.", "Phiz tasks \u2192 direct feed, no UNO required.", "\u5B8C\u6210 Phiz \u4EFB\u52A1\u76F4\u63A5\u9886\u9972\u6599\uFF0C\u65E0\u9700\u73A9 UNO\u3002"],
  taskAttemptLimit: ["Limite de tr\xEAs envios por tarefa no dia. Fale com a equipe.", "Three submissions per task per day reached. Contact the team.", "\u8BE5\u4EFB\u52A1\u4ECA\u65E5\u5DF2\u63D0\u4EA4 3 \u6B21\uFF0C\u8BF7\u8054\u7CFB\u5BA1\u6838\u56E2\u961F\u3002"],
  taskNotApproved: ["Aguarde a aprova\xE7\xE3o do comprovante antes de receber.", "Wait for evidence approval before claiming.", "\u8BF7\u7B49\u5F85\u51ED\u8BC1\u5BA1\u6838\u901A\u8FC7\u540E\u518D\u9886\u53D6\u3002"],
  taskMissing: ["Pedido n\xE3o encontrado.", "Submission not found.", "\u627E\u4E0D\u5230\u8FD9\u6761\u4EFB\u52A1\u8BB0\u5F55\u3002"],
  taskPhizUsed: ["Este Phiz ID j\xE1 est\xE1 associado a outro participante nesta fase.", "This Phiz ID is already linked to another participant in this phase.", "\u6B64 Phiz ID \u672C\u9636\u6BB5\u5DF2\u7528\u4E8E\u5176\u4ED6\u53C2\u4E0E\u8005\u3002"],
  taskProfileLocked: ["Use o mesmo Phiz ID dos seus comprovantes anteriores. Para corrigir, fale com a equipe.", "Use the same Phiz ID as earlier submissions. Contact the team for corrections.", "\u8BF7\u4F7F\u7528\u672C\u9636\u6BB5\u5DF2\u63D0\u4EA4\u7684\u540C\u4E00\u4E2A Phiz ID\uFF1B\u9700\u66F4\u6B63\u65F6\u8BF7\u8054\u7CFB\u6D3B\u52A8\u56E2\u961F\u3002"],
  taskDetailsRequired: ["Preencha seu Phiz ID, os detalhes e a autoriza\xE7\xE3o.", "Enter your Phiz ID, details and consent.", "\u8BF7\u586B\u5199 Phiz ID\u3001\u5B8C\u6210\u8BF4\u660E\u5E76\u52FE\u9009\u6388\u6743\u3002"],
  taskImageInvalid: ["Use uma imagem JPG, PNG ou WebP v\xE1lida.", "Use a valid JPG, PNG or WebP image.", "\u8BF7\u9009\u62E9\u6709\u6548\u7684 JPG\u3001PNG \u6216 WebP \u56FE\u7247\u3002"],
  taskImageTooLarge: ["A imagem excede o tamanho permitido. Recorte a \xE1rea necess\xE1ria e tente novamente.", "The image is too large. Crop to the relevant area and try again.", "\u56FE\u7247\u8FC7\u5927\uFF0C\u8BF7\u88C1\u526A\u5230\u6240\u9700\u5185\u5BB9\u540E\u91CD\u8BD5\u3002"],
  taskProofRequired: ["Envie comprovantes para an\xE1lise antes de receber.", "Submit evidence for review before claiming.", "\u8BF7\u5148\u63D0\u4EA4\u4EFB\u52A1\u51ED\u8BC1\u5E76\u901A\u8FC7\u5BA1\u6838\u3002"],
  taskFeedEntry: ["Ra\xE7\xE3o de tarefa Phiz", "Phiz task feed", "Phiz \u4EFB\u52A1\u9972\u6599"],
  taskBeforeDeadline: ["Reserve tempo para an\xE1lise e receba antes de 24/12 \xB7 23:59 (Bras\xEDlia).", "Allow time for review and claim before Dec 24 \xB7 23:59 (Bras\xEDlia).", "\u8BF7\u9884\u7559\u5BA1\u6838\u65F6\u95F4\uFF0C\u5E76\u5728\u5DF4\u897F\u5229\u4E9A\u65F6\u95F4 12 \u6708 24 \u65E5 23:59 \u524D\u9886\u53D6\u3002"],
  taskNoAuto: ["Abrir uma tela n\xE3o conclui a tarefa. A ra\xE7\xE3o \xE9 liberada ap\xF3s a verifica\xE7\xE3o dos comprovantes.", "Opening a screen does not complete a task. Feed is unlocked after evidence review.", "\u4EC5\u6253\u5F00\u9875\u9762\u4E0D\u7B97\u5B8C\u6210\u4EFB\u52A1\uFF0C\u5BA1\u6838\u4EBA\u5458\u6838\u9A8C\u51ED\u8BC1\u540E\u624D\u4F1A\u5F00\u653E\u9886\u53D6\u3002"],
  taskReviewNote: ["Nota da an\xE1lise", "Review note", "\u5BA1\u6838\u8BF4\u660E"],
  taskConsent: ["Autorizo a equipe a analisar meu Phiz ID e os comprovantes para verificar esta tarefa.", "I authorize the team to review my Phiz ID and evidence to verify this task.", "\u6211\u540C\u610F\u6D3B\u52A8\u56E2\u961F\u4F7F\u7528 Phiz ID \u548C\u51ED\u8BC1\u622A\u56FE\u6838\u9A8C\u672C\u6B21\u4EFB\u52A1\u3002"],
  taskImageHint: ["JPG, PNG ou WebP. Envie apenas o necess\xE1rio e oculte dados pessoais de outras pessoas.", "JPG, PNG or WebP. Include only what is needed and hide other people's private information.", "\u652F\u6301 JPG\u3001PNG\u3001WebP\u3002\u4EC5\u4FDD\u7559\u6838\u9A8C\u6240\u9700\u5185\u5BB9\uFF0C\u906E\u6321\u4ED6\u4EBA\u7684\u624B\u673A\u53F7\u3001\u5730\u5740\u7B49\u65E0\u5173\u4FE1\u606F\u3002"],
  taskImages: ["Comprovantes \xB7 1 a 3 imagens", "Evidence \xB7 1\u20133 images", "\u51ED\u8BC1\u622A\u56FE \xB7 1\u20133 \u5F20"],
  taskDetailsHint: ["Informe os nomes ou IDs relevantes, a data e como o comprovante demonstra a conclus\xE3o.", "Include relevant names or IDs, the date, and how the evidence shows completion.", "\u8BF7\u8BF4\u660E\u76F8\u5173\u6635\u79F0\u6216 ID\u3001\u5B8C\u6210\u65E5\u671F\uFF0C\u4EE5\u53CA\u622A\u56FE\u5982\u4F55\u8BC1\u660E\u4EFB\u52A1\u5DF2\u5B8C\u6210\u3002"],
  taskDetails: ["O que voc\xEA concluiu?", "What did you complete?", "\u4EFB\u52A1\u5B8C\u6210\u8BF4\u660E"],
  taskPhizHint: ["Use o ID do seu perfil. Ele ser\xE1 usado em todas as tarefas desta fase.", "Use your profile ID. It will be used for every task in this phase.", "\u586B\u5199\u4E2A\u4EBA\u8D44\u6599\u4E2D\u7684 Phiz ID\uFF0C\u672C\u9636\u6BB5\u6240\u6709\u4EFB\u52A1\u5747\u4F7F\u7528\u6B64 ID \u6838\u5BF9\u3002"],
  taskPhizId: ["Seu Phiz ID", "Your Phiz ID", "\u4F60\u7684 Phiz ID"],
  taskSubmitted: ["Comprovante enviado para an\xE1lise.", "Evidence submitted for review.", "\u51ED\u8BC1\u5DF2\u63D0\u4EA4\uFF0C\u8BF7\u7B49\u5F85\u4EBA\u5DE5\u5BA1\u6838\u3002"],
  taskSubmit: ["Enviar para an\xE1lise", "Submit for review", "\u63D0\u4EA4\u5BA1\u6838"],
  taskView: ["Ver meu comprovante", "View my evidence", "\u67E5\u770B\u6211\u7684\u51ED\u8BC1"],
  taskBacklog: ["Aprova\xE7\xF5es de dias anteriores continuam dispon\xEDveis para receber at\xE9 o fim da alimenta\xE7\xE3o.", "Approvals from earlier days remain claimable until the feeding deadline.", "\u8DE8\u5929\u5BA1\u6838\u901A\u8FC7\u7684\u4EFB\u52A1\u4ECD\u53EF\u5728\u5582\u517B\u622A\u6B62\u524D\u9886\u53D6\uFF0C\u4E0D\u4F1A\u56E0\u6BCF\u65E5\u5237\u65B0\u800C\u4E22\u5931\u3002"],
  taskHistory: ["Pedidos anteriores", "Earlier submissions", "\u5F80\u65E5\u4EFB\u52A1\u8BB0\u5F55"],
  gameQuota: ["Hoje voc\xEA ainda pode ganhar {remaining}/{cap} pontos \xB7 renova\xE7\xE3o \xE0s 00:00 de Bras\xEDlia", "You can earn {remaining}/{cap} more points today \xB7 resets at 00:00 Bras\xEDlia", "\u4ECA\u65E5\u6E38\u620F\u8FD8\u53EF\u83B7\u5F97 {remaining}/{cap} \u5206 \xB7 \u5DF4\u897F\u5229\u4E9A\u65F6\u95F4 00:00 \u91CD\u7F6E"],
  gameQuotaFull: ["Limite de hoje atingido. Pode continuar jogando por divers\xE3o.", "Today\u2019s limit is reached. You can keep playing for fun.", "\u4ECA\u65E5\u6E38\u620F\u79EF\u5206\u5DF2\u8FBE\u4E0A\u9650\uFF0C\u4ECD\u53EF\u7EE7\u7EED\u6E38\u73A9\u3002"],
  rewardBreakdown: ["Participa\xE7\xE3o +{base} \xB7 Vit\xF3ria +{bonus}", "Participation +{base} \xB7 Win +{bonus}", "\u5B8C\u5C40\u53C2\u4E0E +{base} \xB7 \u83B7\u80DC\u52A0\u5206 +{bonus}"],
  rewardLimited: ["Previsto: {expected}. Creditado: {actual}, pelo limite di\xE1rio.", "Expected {expected}; credited {actual} because of the daily cap.", "\u672C\u8F6E\u5E94\u5F97 {expected} \u5206\uFF0C\u53D7\u6BCF\u65E5\u4E0A\u9650\u5F71\u54CD\u5B9E\u9645\u5230\u8D26 {actual} \u5206\u3002"],
  redeemAvailable: ["Pode trocar por {count} por\xE7\xF5es agora", "Can exchange for {count} portions now", "\u5F53\u524D\u53EF\u5151\u6362 {count} \u4EFD\u9972\u6599"],
  roundWins: ["{count} vit\xF3ria(s)", "{count} round win(s)", "\u83B7\u80DC {count} \u8F6E"],
  gameNoReward: ["Esta partida n\xE3o gera pontos da campanha. O resultado conta apenas como vit\xF3ria ou derrota.", "This game awards no campaign points; only the match result is shown.", "\u672C\u573A\u4E0D\u4EA7\u751F\u53EF\u5151\u6362\u7684\u6D3B\u52A8\u79EF\u5206\uFF0C\u4EC5\u5C55\u793A\u80DC\u8D1F\u6218\u7EE9\u3002"],
  ledgerRound: ["Rodada de amigos", "Friends round", "\u597D\u53CB\u623F\u5B8C\u5C40\u79EF\u5206"],
  taskQuota: ["At\xE9 {limit} tarefas por dia; restam {remaining} vagas. Tarefas em an\xE1lise tamb\xE9m ocupam vagas.", "Up to {limit} tasks daily; {remaining} slots remain. Pending submissions also reserve slots.", "\u6BCF\u5929\u6700\u591A\u9009\u62E9 {limit} \u9879\uFF0C\u4ECA\u65E5\u8FD8\u53EF\u9009\u62E9 {remaining} \u9879\uFF1B\u5F85\u5BA1\u4EFB\u52A1\u4E5F\u5360\u540D\u989D\u3002"],
  taskDailyLimit: ["A cota de tarefas est\xE1 completa. Escolha novamente amanh\xE3 ou veja os envios existentes.", "Your task quota is full. Choose again tomorrow or view existing submissions.", "\u4ECA\u65E5\u4EFB\u52A1\u540D\u989D\u6216\u9972\u6599\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF0C\u8BF7\u660E\u5929\u518D\u9009\uFF1B\u5DF2\u63D0\u4EA4\u4EFB\u52A1\u4ECD\u53EF\u67E5\u770B\u548C\u9886\u53D6\u3002"],
  taskNoSlots: ["Cota de hoje completa", "Today\u2019s quota is full", "\u4ECA\u65E5\u540D\u989D\u5DF2\u6EE1"],
  taskLegacy: ["Envios anteriores \xE0 atualiza\xE7\xE3o mant\xEAm a recompensa original.", "Submissions from before the update retain their original rewards.", "\u66F4\u65B0\u524D\u5DF2\u63D0\u4EA4\u7684\u4EFB\u52A1\u6309\u539F\u5956\u52B1\u5151\u73B0\u3002"],
  taskDailyMax: ["At\xE9 {count} por\xE7\xF5es extras por dia", "Up to {count} extra portions daily", "\u6BCF\u65E5\u6700\u591A\u989D\u5916\u9886\u53D6 {count} \u4EFD\u9972\u6599"],
  taskReward: ["+{count} por\xE7\xF5es", "+{count} portions", "\u989D\u5916 {count} \u4EFD\u9972\u6599"],
  taskNotStarted: ["Dispon\xEDvel hoje", "Available today", "\u4ECA\u65E5\u5F85\u5B8C\u6210"],
  taskClaimed: ["Ra\xE7\xE3o recebida", "Feed claimed", "\u9972\u6599\u5DF2\u9886\u53D6"],
  taskRejected: ["Reenvie o comprovante", "Resubmit evidence", "\u51ED\u8BC1\u672A\u901A\u8FC7 \xB7 \u8BF7\u91CD\u65B0\u63D0\u4EA4"],
  taskApproved: ["Aprovado \xB7 pode receber", "Approved \xB7 ready to claim", "\u5BA1\u6838\u901A\u8FC7 \xB7 \u53EF\u9886\u53D6"],
  taskPending: ["Em an\xE1lise", "Under review", "\u5BA1\u6838\u4E2D"],
  taskClaim: ["Receber {count} por\xE7\xF5es", "Claim {count} portions", "\u9886\u53D6 {count} \u4EFD\u9972\u6599"],
  taskGo: ["Ver tarefa e enviar", "View task & submit", "\u67E5\u770B\u4EFB\u52A1\u5E76\u63D0\u4EA4\u51ED\u8BC1"],
  taskManual: ["An\xE1lise manual", "Manual review", "\u4EBA\u5DE5\u5BA1\u6838"],
  taskParcelGuide: ["Abra o miniapp Anjun no Phiz e consulte um pacote. Mostre a consulta conclu\xEDda e a data. Oculte endere\xE7o, telefone e parte do c\xF3digo de rastreio; inclua seu Phiz ID no comprovante.", "Open the Anjun miniapp in Phiz and look up a parcel. Show the completed lookup and date. Hide addresses, phone numbers and part of the tracking code; include evidence of your Phiz ID.", "\u5728 Phiz \u5185\u6253\u5F00 Anjun \u5C0F\u7A0B\u5E8F\u5E76\u6210\u529F\u67E5\u8BE2\u5305\u88F9\uFF0C\u622A\u56FE\u5C55\u793A\u67E5\u8BE2\u7ED3\u679C\u53CA\u65E5\u671F\u3002\u906E\u6321\u5730\u5740\u3001\u624B\u673A\u53F7\u548C\u90E8\u5206\u8FD0\u5355\u53F7\uFF0C\u540C\u65F6\u63D0\u4F9B\u53EF\u6838\u5BF9\u7684\u672C\u4EBA Phiz ID\u3002"],
  taskMomentGuide: ["Publique um Moment no Phiz. Mostre a publica\xE7\xE3o, a data e o autor, com seu Phiz ID identific\xE1vel.", "Publish a Phiz Moment. Show the post, date and author with your Phiz ID identifiable.", "\u5728 Phiz \u53D1\u5E03 Moment\uFF0C\u622A\u56FE\u5E94\u5C55\u793A\u53D1\u5E03\u5185\u5BB9\u3001\u65E5\u671F\u3001\u4F5C\u8005\uFF0C\u4EE5\u53CA\u53EF\u6838\u5BF9\u7684\u672C\u4EBA Phiz ID\u3002"],
  taskGroupGuide: ["No Phiz, crie um grupo. Mostre o nome, a data e que voc\xEA o criou. Inclua seu Phiz ID no comprovante.", "Create a Phiz group. Show the group name, date, and that you created it. Include evidence of your Phiz ID.", "\u5728 Phiz \u521B\u5EFA\u7FA4\u804A\uFF0C\u622A\u56FE\u5E94\u5C55\u793A\u7FA4\u540D\u3001\u521B\u5EFA\u65E5\u671F\u4EE5\u53CA\u4F60\u662F\u521B\u5EFA\u8005\uFF0C\u5E76\u80FD\u6838\u5BF9\u672C\u4EBA Phiz ID\u3002"],
  taskFriendsGuide: ["No Phiz, adicione tr\xEAs novos amigos. Envie uma captura que mostre as novas conex\xF5es e informe os tr\xEAs nomes ou IDs na descri\xE7\xE3o. Inclua seu Phiz ID no comprovante.", "In Phiz, add three new friends. Upload evidence of the new connections and list all three names or IDs in the details. Include evidence of your own Phiz ID.", "\u5728 Phiz \u6DFB\u52A0 3 \u4F4D\u65B0\u597D\u53CB\uFF0C\u4E0A\u4F20\u80FD\u8BC1\u660E\u65B0\u589E\u597D\u53CB\u7684\u622A\u56FE\uFF0C\u5E76\u5728\u8BF4\u660E\u4E2D\u5217\u51FA 3 \u4F4D\u597D\u53CB\u7684\u6635\u79F0\u6216 ID\uFF0C\u540C\u65F6\u63D0\u4F9B\u80FD\u6838\u5BF9\u672C\u4EBA Phiz ID \u7684\u51ED\u8BC1\u3002"],
  taskParcelDesc: ["Veja uma consulta de rastreio conclu\xEDda no miniapp.", "Complete a tracking lookup in the miniapp.", "\u4ECA\u65E5\u5728 Anjun \u5C0F\u7A0B\u5E8F\u6210\u529F\u67E5\u8BE2\u4E00\u6B21\u7535\u5546\u5305\u88F9\u8F68\u8FF9\u3002"],
  taskMomentDesc: ["Publique um novo Moment hoje.", "Publish a new Moment today.", "\u4ECA\u65E5\u5728 Phiz \u53D1\u5E03\u4E00\u6761\u65B0 Moment\u3002"],
  taskGroupDesc: ["Crie um novo grupo hoje.", "Create a new group today.", "\u4ECA\u65E5\u5728 Phiz \u521B\u5EFA\u4E00\u4E2A\u65B0\u7FA4\u804A\u3002"],
  taskFriendsDesc: ["Adicione tr\xEAs novos amigos hoje.", "Add three new friends today.", "\u4ECA\u65E5\u5728 Phiz \u6210\u529F\u6DFB\u52A0 3 \u4E2A\u65B0\u597D\u53CB\u3002"],
  taskParcel: ["Consulte seu pacote no Anjun", "Track a parcel in Anjun", "\u4F7F\u7528 Anjun \u5C0F\u7A0B\u5E8F\u67E5\u8BE2\u5305\u88F9\u8F68\u8FF9"],
  taskMoment: ["Publique um Moment", "Publish a Moment", "\u53D1\u5E03\u4E00\u6761 Moment"],
  taskGroup: ["Crie um grupo no Phiz", "Create a Phiz group", "\u5728 Phiz \u521B\u5EFA\u4E00\u4E2A\u7FA4\u804A"],
  taskFriends: ["Adicione 3 amigos no Phiz", "Add 3 friends on Phiz", "\u5728 Phiz \u6DFB\u52A0 3 \u4E2A\u597D\u53CB"],
  badgeEntry: ["Distintivo do dia", "Daily badge", "\u6BCF\u65E5\u6210\u5C31\u5FBD\u7AE0"],
  badgeClaim: ["Acender distintivo", "Light up badge", "\u70B9\u4EAE\u6210\u5C31\u5FBD\u7AE0"],
  onlineNoRewards: ["Partidas online s\xE3o para divers\xE3o e n\xE3o geram pontos da campanha.", "Online matchmaking is for fun and awards no campaign points.", "\u5728\u7EBF\u5339\u914D\u53EF\u7EE7\u7EED\u6E38\u73A9\uFF0C\u4E0D\u4EA7\u751F\u5723\u8BDE\u6D3B\u52A8\u79EF\u5206\u3002"],
  capacityReward: ["Com {count} pessoas: +{points} por rodada, mais +{bonus} para quem vencer. Limite di\xE1rio: {cap}.", "With {count} players: +{points} per round, plus +{bonus} for winning. Daily cap: {cap}.", "\u5B9E\u9645 {count} \u4EBA\u65F6\uFF0C\u6BCF\u4EBA\u6BCF\u8F6E +{points} \u5206\uFF0C\u80DC\u8005\u989D\u5916 +{bonus}\uFF1B\u6BCF\u65E5\u6700\u591A {cap} \u5206\u3002"],
  roomRewardTier: ["{count} pessoas \xB7 +{points} pts cada", "{count} players \xB7 +{points} pts each", "{count} \u4EBA\u623F \xB7 \u6BCF\u4EBA +{points} \u5206"],
  friendsPointsRule: ["Rodadas de amigos d\xE3o pontos de participa\xE7\xE3o; vencer soma +{bonus}. Limite di\xE1rio: {cap} pontos.", "Friends rounds award participation points; winning adds +{bonus}. Daily limit: {cap} points.", "\u597D\u53CB\u623F\u5B8C\u5C40\u83B7\u5F97\u53C2\u4E0E\u79EF\u5206\uFF0C\u80DC\u8005\u989D\u5916 +{bonus} \u5206\uFF1B\u6BCF\u65E5\u6E38\u620F\u79EF\u5206\u6700\u591A {cap} \u5206\u3002"],
  friendsPointsTitle: ["Com amigos, todos recebem pontos", "Together, everyone earns", "\u597D\u53CB\u540C\u684C\uFF0C\u4EBA\u4EBA\u5F97\u79EF\u5206"],
  friendPointsOnly: ["Pontos v\xEAm apenas de rodadas conclu\xEDdas em salas de amigos.", "Only completed friends-room rounds award points.", "\u4EC5\u597D\u53CB\u623F\u7684\u5B8C\u6574\u5BF9\u5C40\u53EF\u4EE5\u83B7\u5F97\u6D3B\u52A8\u79EF\u5206\u3002"],
  hatchNotReady: ["O ovo est\xE1 sendo incubado. Aguarde mais alguns segundos.", "Your egg is still warming. Just a little longer!", "\u706B\u9E21\u86CB\u6B63\u5728\u5B75\u5316\uFF0C\u8BF7\u518D\u7B49\u4E00\u5C0F\u4F1A\u513F\u3002"],
  eggFirst: ["Receba seu ovo primeiro.", "Claim your egg first.", "\u8BF7\u5148\u9886\u53D6\u706B\u9E21\u86CB\u3002"],
  hatchFirst: ["Aguarde o nascimento do filhote antes de aliment\xE1-lo.", "Hatch your turkey before using feed.", "\u8BF7\u5148\u9886\u53D6\u706B\u9E21\u86CB\u5E76\u5B8C\u6210\u5B75\u5316\u3002"],
  eggStep3: ["Conhecer", "Meet turkey", "\u5C0F\u706B\u9E21\u7834\u58F3"],
  eggStep2: ["Aquecer", "Incubate", "\u6E29\u6696\u5B75\u5316"],
  eggStep1: ["Receber", "Claim egg", "\u9886\u53D6\u706B\u9E21\u86CB"],
  eggPersist: ["O ninho fica salvo. Voc\xEA pode voltar depois.", "Your nest is saved. You can come back later.", "\u5B75\u5316\u8FDB\u5EA6\u4F1A\u4FDD\u5B58\uFF0C\u7A0D\u540E\u56DE\u6765\u4E5F\u80FD\u7EE7\u7EED\u3002"],
  hatchDone: ["Seu pequeno companheiro nasceu!", "Your little companion has hatched!", "\u5C0F\u706B\u9E21\u7834\u58F3\u5566\uFF0C\u6B22\u8FCE\u4F60\u7684\u5723\u8BDE\u4F19\u4F34\uFF01"],
  hatchWait: ["Nasce em {seconds}s", "Hatching in {seconds}s", "\u518D\u7B49 {seconds} \u79D2\u7834\u58F3"],
  hatchEgg: ["Conhecer o filhote", "Meet my turkey", "\u8FCE\u63A5\u5C0F\u706B\u9E21"],
  eggReady: ["O filhote est\xE1 pronto para nascer!", "Someone is ready to say hello!", "\u5C0F\u706B\u9E21\u51C6\u5907\u7834\u58F3\u5566\uFF01"],
  eggIncubating: ["Aquecendo o ninho\u2026", "Warming the nest\u2026", "\u6E29\u6696\u5B75\u5316\u4E2D\u2026"],
  eggUnclaimed: ["Um ovo de Natal espera por voc\xEA", "A Christmas egg is waiting for you", "\u4E00\u9897\u5723\u8BDE\u706B\u9E21\u86CB\u6B63\u5728\u7B49\u4F60"],
  eggReceived: ["Seu ovo chegou! Vamos aquecer o ninho.", "Your egg is here! Let's warm the nest.", "\u706B\u9E21\u86CB\u5DF2\u9886\u53D6\uFF01\u4E00\u8D77\u6E29\u6696\u5C0F\u7A9D\u5427\u3002"],
  claimEgg: ["Receber meu ovo", "Claim my egg", "\u9886\u53D6\u6211\u7684\u706B\u9E21\u86CB"],
  eggIntro: ["Receba seu ovo, acompanhe a incuba\xE7\xE3o e conhe\xE7a o filhote. Depois, jogue em salas de amigos ou conclua tarefas no Phiz para obter ra\xE7\xE3o.", "Claim your egg, follow its incubation and meet your turkey. Then play in friends rooms or complete Phiz tasks to obtain feed.", "\u9886\u53D6\u706B\u9E21\u86CB\u3001\u6E29\u6696\u5B75\u5316\u3001\u8FCE\u63A5\u5C0F\u706B\u9E21\uFF0C\u518D\u901A\u8FC7\u597D\u53CB\u623F\u5BF9\u5C40\u6216 Phiz \u4EFB\u52A1\u83B7\u5F97\u9972\u6599\u3002"],
  eggTitle: ["Todo Natal come\xE7a com um pequeno encanto.", "Every Christmas starts with a little wonder.", "\u9886\u53D6\u4E00\u9897\u86CB\uFF0C\u5B75\u5316\u4F60\u7684\u5723\u8BDE\u4F19\u4F34\u3002"],
  careTab: ["Meu filhote", "My turkey", "\u7167\u987E\u706B\u9E21"],
  dailyTab: ["Ra\xE7\xE3o extra", "Extra feed", "\u6BCF\u65E5\u989D\u5916\u9972\u6599"],
  countdownPreview: ["A festa oficial come\xE7a em", "Official celebration starts in", "\u8DDD\u79BB\u6B63\u5F0F\u5F00\u542F"],
  countdownLive: ["Tempo para crescer", "Time left to grow", "\u8DDD\u79BB\u517B\u6210\u622A\u6B62"],
  dayUnit: ["dias", "days", "\u5929"],
  hourUnit: ["horas", "hours", "\u5C0F\u65F6"],
  minuteUnit: ["min", "min", "\u5206\u949F"],
  petInteract: ["Interagir com o filhote", "Interact with your turkey", "\u6478\u6478\u706B\u9E21"],
  petHint: ["Toque para interagir", "Tap to interact", "\u70B9\u6211\uFF0C\u548C\u6211\u4E92\u52A8"],
  petTalk0: ["Vamos jogar com amigos?", "Ready to play with friends?", "\u557E\uFF01\u4ECA\u5929\u4E00\u8D77\u6253\u724C\u5427\uFF01"],
  petTalk1: ["Cada rodada com amigos ajuda no meu crescimento.", "Each friends-room round helps me grow.", "\u518D\u73A9\u4E00\u5C40\uFF0C\u79BB\u5723\u8BDE\u60CA\u559C\u66F4\u8FD1\u4E00\u6B65\uFF01"],
  petTalk2: ["Obrigado por cuidar de mim!", "Thank you for taking care of me!", "\u6709\u4F60\u966A\u4F34\uFF0C\u5723\u8BDE\u66F4\u5FEB\u4E50\uFF01"],
  petFeedTalk: ["Obrigado pela ra\xE7\xE3o!", "Thank you for the feed!", "\u554A\u545C\uFF01\u9972\u6599\u771F\u9999\uFF01"],
  quickFeed: ["Alimentar +{count}", "Feed +{count}", "\u5582\u517B +{count} \u4EFD"],
  chooseAmount: ["Escolher quantidade", "Choose amount", "\u9009\u62E9\u5582\u517B\u6570\u91CF"],
  growthCollection: ["Seu Natal, do seu jeito", "Make Christmas your own", "\u89E3\u9501\u4F60\u7684\u5723\u8BDE\u5C0F\u5929\u5730"],
  growthCollectionHint: ["Cres\xE7a para liberar cen\xE1rios. Toque nos liberados para decorar.", "Grow to unlock scenes. Tap an unlocked scene to decorate.", "\u968F\u7740\u517B\u6210\u89E3\u9501\u573A\u666F\uFF0C\u70B9\u51FB\u5DF2\u89E3\u9501\u7684\u88C5\u9970\u5373\u53EF\u5207\u6362\u3002"],
  scene0: ["Aconchego", "Cozy", "\u6E29\u6696\u5C0F\u7A9D"],
  scene1: ["Luzinhas", "Lights", "\u5723\u8BDE\u706F\u4E32"],
  scene2: ["Bosque", "Pine grove", "\u677E\u6797\u79D8\u5883"],
  scene3: ["Estrelas", "Starlight", "\u661F\u5149\u4E4B\u591C"],
  scene4: ["Natal dourado", "Golden Christmas", "\u91D1\u8272\u5723\u8BDE"],
  unlocked: ["Liberado", "Unlocked", "\u5DF2\u89E3\u9501"],
  nextUnlock: ["Mais {count} por\xE7\xF5es para o pr\xF3ximo cen\xE1rio", "{count} more portions to the next scene", "\u518D\u5582 {count} \u4EFD\uFF0C\u89E3\u9501\u4E0B\u4E2A\u573A\u666F"],
  allUnlocked: ["Todos os cen\xE1rios liberados!", "All scenes unlocked!", "\u5168\u90E8\u5723\u8BDE\u573A\u666F\u5DF2\u89E3\u9501\uFF01"],
  dailyIntro: ["Conclua tarefas no Phiz e receba ra\xE7\xE3o.", "Complete Phiz tasks to receive feed.", "\u5B8C\u6210 Phiz \u65E5\u5E38\u4EFB\u52A1\uFF0C\u76F4\u63A5\u9886\u53D6\u9972\u6599\u3002"],
  dailyReset: ["Renova\xE7\xE3o di\xE1ria \xE0s 00:00 \xB7 Bras\xEDlia", "Resets daily at 00:00 \xB7 Bras\xEDlia", "\u6BCF\u65E5\u5DF4\u897F\u5229\u4E9A\u65F6\u95F4 00:00 \u5237\u65B0"],
  missionPlay1: ["Primeira rodada do dia", "First round of the day", "\u5F00\u542F\u4ECA\u65E5\u724C\u5C40"],
  missionPlay3: ["Mais uma rodada!", "One more round!", "\u518D\u6765\u4E00\u5C40\uFF01"],
  missionScore50: ["Progresso de Natal", "Christmas progress", "\u5723\u8BDE\u597D\u624B\u6C14"],
  missionPlay1Desc: ["Conclua 1 rodada com amigos hoje", "Finish 1 friends-room round today", "\u4ECA\u65E5\u5B8C\u6574\u5B8C\u6210 1 \u8F6E\u597D\u53CB\u623F\u5BF9\u5C40"],
  missionPlay3Desc: ["Conclua 3 rodadas com amigos hoje", "Finish 3 friends-room rounds today", "\u4ECA\u65E5\u5B8C\u6574\u5B8C\u6210 3 \u8F6E\u597D\u53CB\u623F\u5BF9\u5C40"],
  missionScore50Desc: ["Some 50 pontos de participa\xE7\xE3o hoje", "Earn 50 participation points today", "\u4ECA\u65E5\u7D2F\u8BA1\u83B7\u5F97 50 \u5206\u597D\u53CB\u623F\u53C2\u4E0E\u79EF\u5206"],
  dailyClaim: ["Receber +{count} pts", "Claim +{count} pts", "\u9886\u53D6 +{count} \u79EF\u5206"],
  dailyClaimed: ["Recebido", "Claimed", "\u5DF2\u9886\u53D6"],
  dailyGoPlay: ["Vamos jogar", "Let's play", "\u53BB\u5B8C\u6210"],
  dailyDone: ["Ra\xE7\xE3o extra recebida!", "Extra feed received!", "\u989D\u5916\u9972\u6599\u5DF2\u5230\u8D26\uFF01"],
  dailyEntry: ["Recompensa de miss\xE3o", "Mission reward", "\u6BCF\u65E5\u4EFB\u52A1\u5956\u52B1"],
  dailyRules: ["Escolha at\xE9 {slots} tarefas por dia, com no m\xE1ximo {taskCap} por\xE7\xF5es. Pendentes reservam vagas; rejeitadas liberam a vaga. Ap\xF3s an\xE1lise manual, receba ra\xE7\xE3o direta, sem pontos nem UNO. A data de envio define a cota, mesmo com an\xE1lise posterior.", "Choose up to {slots} tasks daily, at most {taskCap} portions. Pending tasks reserve slots; rejection releases them. Claim direct feed after manual review, without points or UNO. Submission date determines the quota, even with later approval.", "\u6BCF\u5929\u56DB\u9879\u4EFB\u52A1\u4EFB\u9009\u6700\u591A {slots} \u9879\uFF0C\u5408\u8BA1\u6700\u591A {taskCap} \u4EFD\u9972\u6599\u3002\u5F85\u5BA1\u6838\u4E5F\u5360\u540D\u989D\uFF0C\u9A73\u56DE\u540E\u91CA\u653E\u3002\u5BA1\u6838\u901A\u8FC7\u540E\u76F4\u63A5\u9886\u53D6\u9972\u6599\uFF0C\u65E0\u9700\u79EF\u5206\u6216\u73A9 UNO\uFF1B\u8DE8\u5929\u5BA1\u6838\u4ECD\u8BA1\u5165\u63D0\u4EA4\u65E5\u989D\u5EA6\u3002"],
  missionNotReady: ["Conclua a miss\xE3o antes de receber.", "Complete the mission before claiming.", "\u8BF7\u5148\u5B8C\u6210\u4EFB\u52A1\u518D\u9886\u53D6\u5956\u52B1\u3002"],
  viewKit: ["Ver o Kit Seara", "View the Kit Seara", "\u67E5\u770B Kit Seara \u5B9E\u7269"],
  kitCaption: ["Imagem do pr\xEAmio fornecida pela organiza\xE7\xE3o.", "Prize image supplied by the organizer.", "\u6D3B\u52A8\u65B9\u63D0\u4F9B\u7684 Kit Seara \u793C\u76D2\u56FE\u7247\u3002"],
  kitAlt: ["Kit Seara com bolsa t\xE9rmica e produto Fiesta", "Kit Seara with insulated bag and Fiesta product", "Kit Seara \u793C\u76D2\uFF1A\u4FDD\u6E29\u624B\u63D0\u888B\u53CA Fiesta \u4EA7\u54C1"],
  celebrationTitle: ["Crescimento conclu\xEDdo! Confira sua posi\xE7\xE3o.", "Growth complete! Check your rank.", "\u517B\u6210\u5B8C\u6210\uFF0C\u67E5\u770B\u4F60\u7684\u5468\u699C\u540D\u6B21\u3002"],
  celebrationDesc: ["Crescimento conclu\xEDdo! Confira se sua primeira conclus\xE3o ficou entre as 100 primeiras da semana para solicitar o pr\xEAmio.", "Growth complete! Check whether your first completion was among the week\u2019s first 100 to claim.", "\u517B\u6210\u5B8C\u6210\uFF01\u9996\u6B21\u8FBE\u6210\u8FDB\u5165\u5F53\u5468\u524D 100 \u540D\uFF0C\u624D\u53EF\u767B\u8BB0\u7533\u9886\u5956\u54C1\u3002"],
  growthUnlocked: ["Um novo cen\xE1rio de Natal foi liberado!", "A new Christmas scene is unlocked!", "\u6210\u957F\u5347\u7EA7\uFF01\u65B0\u7684\u5723\u8BDE\u573A\u666F\u5DF2\u89E3\u9501\uFF01"],
  playForPoints: ["Jogar com amigos", "Play with friends", "\u548C\u597D\u53CB\u4E00\u8D77\u8D5A\u79EF\u5206"],
  portion: ["por\xE7\xF5es", "portions", "\u4EFD"],
  prizeEyebrow: [
    "SEU PRESENTE DE NATAL",
    "YOUR CHRISTMAS GIFT",
    "\u4F60\u7684\u5723\u8BDE\u793C\u7269"
  ],
  farmAfterRound: [
    "Ao terminar a partida, volte ao in\xEDcio para alimentar o filhote.",
    "Visit your turkey after this game.",
    "\u672C\u573A\u5BF9\u5C40\u7ED3\u675F\u540E\uFF0C\u8FD4\u56DE\u5927\u5385\u5582\u517B\u706B\u9E21\u3002"
  ],
  name: ["Natal ONO!", "ONO! Christmas", "ONO! \u5723\u8BDE\u5B63"],
  preview: ["Vers\xE3o de testes", "Test edition", "\u6D3B\u52A8\u6D4B\u8BD5\u7248"],
  live: ["Natal premiado", "Christmas rewards", "\u5723\u8BDE\u793C\u76D2\u6D3B\u52A8"],
  official: [
    "Oficial a partir de 10/12",
    "Official launch \xB7 Dec 10",
    "12 \u6708 10 \u65E5\u6B63\u5F0F\u5F00\u542F"
  ],
  hero: [
    "Jogue com amigos e participe do Natal ONO!",
    "Play with friends and join ONO! Christmas.",
    "\u597D\u724C\u597D\u5FC3\u60C5\uFF0C\u517B\u6210\u5723\u8BDE\u60CA\u559C\u3002"
  ],
  intro: ["Cuide do filhote de Natal: jogue em salas de amigos para ganhar pontos e troc\xE1-los por ra\xE7\xE3o, ou conclua tarefas no Phiz para receber ra\xE7\xE3o diretamente.", "Raise your Christmas turkey: play in friends rooms to earn points for feed, or complete Phiz tasks to claim feed directly.", "\u548C\u597D\u53CB\u73A9 UNO \u8D5A\u79EF\u5206\uFF0C\u6216\u5B8C\u6210 Phiz \u4EFB\u52A1\u76F4\u63A5\u9886\u9972\u6599\uFF0C\u4E00\u8D77\u517B\u5927\u5723\u8BDE\u706B\u9E21\u3002"],
  pet: ["Meu filhote de Natal", "My Christmas turkey", "\u6211\u7684\u5723\u8BDE\u706B\u9E21"],
  baby: ["Pequeno companheiro", "Little companion", "\u5C0F\u5C0F\u706B\u9E21"],
  growing: ["Crescendo com carinho", "Growing with care", "\u8301\u58EE\u6210\u957F\u4E2D"],
  grown: ["Pronto para celebrar!", "Ready to celebrate!", "\u706B\u9E21\u5DF2\u7ECF\u517B\u5927\uFF01"],
  fed: ["por\xE7\xF5es servidas", "portions fed", "\u4EFD\u5DF2\u5582\u517B"],
  points: ["Pontos da campanha", "Campaign points", "\u6D3B\u52A8\u79EF\u5206"],
  feed: ["Ra\xE7\xE3o no celeiro", "Feed in the barn", "\u9972\u6599\u5E93\u5B58"],
  progress: ["Crescimento", "Growth", "\u6210\u957F\u8FDB\u5EA6"],
  exchange: ["Trocar pontos", "Exchange points", "\u5151\u6362\u9972\u6599"],
  feedAction: ["Alimentar", "Feed turkey", "\u5582\u517B\u706B\u9E21"],
  goal: ["{goal} por\xE7\xF5es para crescer; pr\xEAmio para os 100 primeiros de cada semana", "{goal} portions to grow; prizes for the first 100 each week", "\u7D2F\u8BA1 {goal} \u4EFD\u5B8C\u6210\u517B\u6210\uFF0C\u6BCF\u5468\u524D 100 \u540D\u53EF\u83B7\u5956"],
  ratio: [
    "{rate} pontos = 1 por\xE7\xE3o",
    "{rate} points = 1 portion",
    "{rate} \u79EF\u5206 = 1 \u4EFD\u9972\u6599"
  ],
  deadline: [
    "Alimente at\xE9 24/12 \xB7 23:59 (Bras\xEDlia)",
    "Grow by Dec 24 \xB7 23:59 (Bras\xEDlia)",
    "12 \u6708 24 \u65E5 23:59 \u524D\u517B\u6210\uFF08\u5DF4\u897F\u5229\u4E9A\u65F6\u95F4\uFF09"
  ],
  testNote: ["Teste: ovos, pontos, ra\xE7\xE3o e pedidos s\xE3o separados da campanha oficial. Nenhum pr\xEAmio real \xE9 enviado nesta fase.", "Test mode: eggs, points, feed and claims are separate from the official campaign. No real prizes are sent in this phase.", "\u6D4B\u8BD5\u706B\u9E21\u86CB\u3001\u79EF\u5206\u3001\u9972\u6599\u548C\u7533\u9886\u8BB0\u5F55\u4E0E\u6B63\u5F0F\u6D3B\u52A8\u72EC\u7ACB\u4FDD\u5B58\uFF0C\u6D4B\u8BD5\u9636\u6BB5\u4E0D\u53D1\u653E\u5B9E\u7269\u5956\u54C1\u3002"],
  resetNote: [
    "O teste ser\xE1 zerado no in\xEDcio oficial, em 10/12.",
    "Test progress resets at the official launch on Dec 10.",
    "\u6B63\u5F0F\u6D3B\u52A8 12 \u6708 10 \u65E5\u5F00\u542F\uFF0C\u6D4B\u8BD5\u8FDB\u5EA6\u4E0D\u8BA1\u5165\u6B63\u5F0F\u6D3B\u52A8\u3002"
  ],
  gift: ["Receber pontos de teste", "Get test points", "\u9886\u53D6\u6D4B\u8BD5\u4F53\u9A8C\u79EF\u5206"],
  giftInfo: [
    "{gift} pontos de teste \xB7 uma vez por jogador",
    "{gift} test points \xB7 once per player",
    "\u4E00\u6B21\u6027 {gift} \u6D4B\u8BD5\u79EF\u5206\uFF0C\u4EC5\u7528\u4E8E\u4F53\u9A8C"
  ],
  giftDone: [
    "Pontos de teste recebidos",
    "Test points received",
    "\u5DF2\u9886\u53D6\u6D4B\u8BD5\u79EF\u5206"
  ],
  prizeTitle: [
    "Seu Natal pode ganhar um Kit Seara",
    "A Kit Seara for your Christmas",
    "\u517B\u6210\u706B\u9E21\uFF0C\u7533\u9886 Kit Seara \u793C\u76D2"
  ],
  prizeDesc: ["Os primeiros 100 a completar o crescimento em cada semana podem solicitar o pr\xEAmio. Uma premia\xE7\xE3o por pessoa na campanha; entrega ap\xF3s an\xE1lise.", "The first 100 to complete growth each week can claim. One prize per person during the campaign; fulfilment follows review.", "\u6BCF\u5468\u6700\u5148\u5B8C\u6210\u517B\u6210\u7684 100 \u4EBA\u53EF\u7533\u9886\u5956\u54C1\uFF0C\u6BCF\u4EBA\u6574\u4E2A\u6D3B\u52A8\u6700\u591A\u83B7\u5956\u4E00\u6B21\uFF0C\u767B\u8BB0\u540E\u7ECF\u4EBA\u5DE5\u5BA1\u6838\u53D1\u653E\u3002"],
  prize: ["Kit Seara", "Kit Seara", "Kit Seara \u706B\u9E21\u793C\u76D2"],
  prizeNote: [
    "Imagem fornecida pela organiza\xE7\xE3o \xB7 entrega ap\xF3s an\xE1lise manual.",
    "Image supplied by the organizer \xB7 fulfilment after manual review.",
    "\u793C\u76D2\u56FE\u7247\u7531\u6D3B\u52A8\u65B9\u63D0\u4F9B\uFF0C\u767B\u8BB0\u540E\u7ECF\u4EBA\u5DE5\u5BA1\u6838\u53D1\u653E\u3002"
  ],
  claim: ["Solicitar meu kit", "Claim my kit", "\u767B\u8BB0\u7533\u9886\u793C\u76D2"],
  claimTest: ["Simular solicita\xE7\xE3o", "Simulate a claim", "\u4F53\u9A8C\u7533\u9886\u767B\u8BB0"],
  locked: ["Complete o crescimento e esteja entre os 100 primeiros da sua semana de conclus\xE3o para solicitar o pr\xEAmio.", "Complete growth and be among the first 100 in your completion week to claim.", "\u5B8C\u6210\u517B\u6210\u4E14\u8FDB\u5165\u9996\u6B21\u8FBE\u6210\u5F53\u5468\u524D 100 \u540D\uFF0C\u624D\u80FD\u7533\u9886\u3002"],
  rules: ["Regras da campanha", "Campaign rules", "\u6D3B\u52A8\u89C4\u5219"],
  history: ["Minha atividade", "My activity", "\u79EF\u5206\u4E0E\u5582\u517B\u8BB0\u5F55"],
  empty: [
    "Sua hist\xF3ria de Natal come\xE7a na pr\xF3xima partida.",
    "Your Christmas story starts with your next game.",
    "\u4E0B\u4E00\u573A\u5BF9\u5C40\uFF0C\u5F00\u542F\u4F60\u7684\u5723\u8BDE\u517B\u6210\u8BB0\u5F55\u3002"
  ],
  round: ["Pontos da rodada", "Round points", "\u672C\u8F6E\u5BF9\u5C40\u79EF\u5206"],
  giftEntry: ["Presente de teste", "Test gift", "\u6D4B\u8BD5\u4F53\u9A8C\u79EF\u5206"],
  exchangeEntry: ["Troca por ra\xE7\xE3o", "Feed exchange", "\u79EF\u5206\u5151\u6362\u9972\u6599"],
  feedEntry: ["Alimenta\xE7\xE3o do filhote", "Turkey feeding", "\u5582\u517B\u706B\u9E21"],
  rules1: ["S\xF3 salas de amigos com pessoas reais d\xE3o pontos: participa\xE7\xE3o por rodada +{bonus} por vit\xF3ria, at\xE9 {cap} por dia. O saldo \xE9 \xFAnico.", "Only all-human friends rooms award points: round participation plus {bonus} for winning, up to {cap} daily, in one wallet.", "\u53EA\u6709\u7EAF\u771F\u4EBA\u597D\u53CB\u623F\u53D1\u6D3B\u52A8\u79EF\u5206\uFF1A\u5B8C\u5C40\u53C2\u4E0E\u5956\u52B1\uFF0B\u80DC\u8005\u989D\u5916 {bonus} \u5206\uFF0C\u6BCF\u5929\u6700\u591A {cap} \u5206\uFF0C\u5168\u90E8\u8FDB\u5165\u540C\u4E00\u94B1\u5305\u3002"],
  rules2: [
    "Troque {rate} pontos por 1 por\xE7\xE3o. Alimente {goal} por\xE7\xF5es at\xE9 24/12 \xE0s 23:59, no hor\xE1rio de Bras\xEDlia, para completar o crescimento.",
    "Exchange {rate} points for one portion. Feed {goal} portions by Dec 24 at 23:59 Bras\xEDlia time to complete growth.",
    "\u6BCF {rate} \u79EF\u5206\u5151\u6362 1 \u4EFD\u9972\u6599\uFF0C\u5DF4\u897F\u5229\u4E9A\u65F6\u95F4 12 \u6708 24 \u65E5 23:59 \u524D\u7D2F\u8BA1\u5582\u517B {goal} \u4EFD\u5B8C\u6210\u517B\u6210\u3002"
  ],
  rules3: [
    "Teste dispon\xEDvel agora. A campanha oficial come\xE7a em 10/12/2026 \xE0s 00:00 (Bras\xEDlia), com saldo e progresso novos.",
    "Testing is open now. The official campaign starts Dec 10, 2026 at 00:00 Bras\xEDlia time, with fresh balances and growth.",
    "\u6D4B\u8BD5\u7248\u73B0\u5DF2\u5F00\u653E\uFF1B\u6B63\u5F0F\u6D3B\u52A8\u4E8E 2026 \u5E74 12 \u6708 10 \u65E5\u5DF4\u897F\u5229\u4E9A\u65F6\u95F4 00:00 \u5F00\u59CB\uFF0C\u4F7F\u7528\u72EC\u7ACB\u7684\u65B0\u79EF\u5206\u548C\u6210\u957F\u8FDB\u5EA6\u3002"
  ],
  rules4: ["Os primeiros 100 a concluir o crescimento por semana recebem o direito de solicitar imediatamente. Semana: segunda 00:00 at\xE9 domingo 23:59:59, hor\xE1rio de Bras\xEDlia. O progresso \xE9 mantido; cada pessoa entra apenas na primeira conclus\xE3o e pode ganhar uma vez na campanha. Registre at\xE9 28/12; pedidos passam por an\xE1lise manual.", "The first 100 completions each week qualify to claim immediately. Weeks run Monday 00:00 through Sunday 23:59:59 Bras\xEDlia time. Progress is kept; each person enters on their first completion and can win once during the campaign. Register by Dec 28; claims are manually reviewed.", "\u6BCF\u5468\u6700\u5148\u5B8C\u6210\u517B\u6210\u7684 100 \u4EBA\u7ACB\u5373\u53D6\u5F97\u7533\u9886\u8D44\u683C\u3002\u5DF4\u897F\u5229\u4E9A\u65F6\u95F4\u5468\u4E00 00:00 \u5F00\u699C\uFF0C\u5468\u65E5 23:59:59 \u622A\u6B62\uFF1B\u8DE8\u5468\u4FDD\u7559\u8FDB\u5EA6\uFF0C\u6BCF\u4EBA\u4EC5\u9996\u6B21\u8FBE\u6210\u65F6\u53C2\u699C\uFF0C\u6574\u4E2A\u6D3B\u52A8\u6700\u591A\u83B7\u5956\u4E00\u6B21\u3002\u8BF7\u5728 12 \u6708 28 \u65E5\u524D\u767B\u8BB0\uFF0C\u5956\u54C1\u7ECF\u4EBA\u5DE5\u5BA1\u6838\u53D1\u653E\u3002"],
  rules5: ["Salas de amigos s\xE3o gr\xE1tis. Rodadas abandonadas e partidas online n\xE3o d\xE3o pontos da campanha. O placar da mesa usa vit\xF3rias, sem outro saldo de pontos.", "Friends rooms are free. Abandoned rounds and online matches award no campaign points. Table standings use round wins, not a second point balance.", "\u597D\u53CB\u623F\u514D\u8D39\u521B\u5EFA\u548C\u52A0\u5165\uFF1B\u672A\u5B8C\u6210\u7684\u8F6E\u6B21\u3001\u5728\u7EBF\u5339\u914D\u4E0D\u53D1\u6D3B\u52A8\u79EF\u5206\u3002\u591A\u8F6E\u5BF9\u5C40\u6309\u83B7\u80DC\u8F6E\u6570\u6392\u540D\uFF0C\u53D6\u6D88\u53E6\u4E00\u5957 UNO \u724C\u5206\u5C55\u793A\u3002"],
  paused: ["Campanha pausada", "Campaign paused", "\u6D3B\u52A8\u6682\u505C"],
  ended: [
    "O prazo de alimenta\xE7\xE3o terminou.",
    "The feeding period has ended.",
    "\u5582\u517B\u65F6\u95F4\u5DF2\u622A\u6B62\u3002"
  ],
  quantity: ["Quantidade de por\xE7\xF5es", "Number of portions", "\u9972\u6599\u4EFD\u6570"],
  available: ["Dispon\xEDvel", "Available", "\u5F53\u524D\u53EF\u7528"],
  all: ["Tudo", "All", "\u5168\u90E8"],
  cost: ["Voc\xEA usa {count} pontos", "Use {count} points", "\u6D88\u8017 {count} \u79EF\u5206"],
  feedCost: [
    "Servir {count} por\xE7\xF5es",
    "Feed {count} portions",
    "\u672C\u6B21\u5582\u517B {count} \u4EFD"
  ],
  confirmExchange: ["Trocar agora", "Exchange now", "\u7ACB\u5373\u5151\u6362"],
  confirmFeed: ["Alimentar agora", "Feed now", "\u7ACB\u5373\u5582\u517B"],
  noFeed: [
    "Troque pontos por ra\xE7\xE3o ou receba ra\xE7\xE3o nas tarefas do Phiz.",
    "Exchange points for feed or claim feed from Phiz tasks.",
    "\u5148\u7528\u79EF\u5206\u5151\u6362\u9972\u6599\uFF0C\u6216\u5B8C\u6210 Phiz \u4EFB\u52A1\u9886\u53D6\u9972\u6599\uFF0C\u518D\u6765\u5582\u517B\u706B\u9E21\u3002"
  ],
  noPoints: [
    "Conclua uma rodada em uma sala de amigos para receber pontos.",
    "Complete a friends-room round to earn points.",
    "\u5B8C\u6210\u4E00\u8F6E\u597D\u53CB\u623F\u5BF9\u5C40\u540E\u5373\u53EF\u83B7\u5F97\u79EF\u5206\u3002"
  ],
  cancel: ["Cancelar", "Cancel", "\u53D6\u6D88"],
  close: ["Fechar", "Close", "\u5173\u95ED"],
  nameLabel: ["Nome para contato", "Contact name", "\u8054\u7CFB\u4EBA\u59D3\u540D"],
  contactLabel: [
    "WhatsApp com c\xF3digo do pa\xEDs",
    "WhatsApp with country code",
    "WhatsApp \u624B\u673A\u53F7\uFF08\u542B\u56FD\u5BB6\u533A\u53F7\uFF09"
  ],
  contactPlaceholder: [
    "+55 11 99999 9999",
    "+55 11 99999 9999",
    "+55 11 99999 9999"
  ],
  consent: [
    "Autorizo o uso deste contato para an\xE1lise e entrega do pr\xEAmio.",
    "I agree to this contact being used for claim review and prize fulfilment.",
    "\u540C\u610F\u5C06\u4EE5\u4E0A\u8054\u7CFB\u65B9\u5F0F\u7528\u4E8E\u7533\u9886\u5BA1\u6838\u53CA\u5956\u54C1\u53D1\u653E\u8054\u7CFB\u3002"
  ],
  submitClaim: ["Enviar pedido", "Submit claim", "\u63D0\u4EA4\u7533\u9886"],
  testClaimNote: [
    "Este pedido \xE9 de teste e n\xE3o gera envio de pr\xEAmio.",
    "This is a test claim and does not trigger a real delivery.",
    "\u672C\u6B21\u4E3A\u6D4B\u8BD5\u7533\u9886\uFF0C\u4E0D\u4F1A\u53D1\u653E\u5B9E\u7269\u5956\u54C1\u3002"
  ],
  claimStatus: ["Seu pedido", "Your claim", "\u6211\u7684\u7533\u9886"],
  pending: [
    "Aguardando an\xE1lise manual",
    "Awaiting manual review",
    "\u7B49\u5F85\u4EBA\u5DE5\u5BA1\u6838"
  ],
  test_pending: [
    "Pedido de teste registrado",
    "Test claim registered",
    "\u6D4B\u8BD5\u7533\u9886\u5DF2\u767B\u8BB0"
  ],
  approved: [
    "Aprovado \xB7 preparando entrega",
    "Approved \xB7 preparing delivery",
    "\u5BA1\u6838\u901A\u8FC7\uFF0C\u51C6\u5907\u53D1\u653E"
  ],
  test_approved: ["Simula\xE7\xE3o aprovada", "Simulation approved", "\u6D4B\u8BD5\u5BA1\u6838\u901A\u8FC7"],
  shipped: ["Enviado", "Shipped", "\u5DF2\u53D1\u653E"],
  rejected: [
    "Entre em contato com a equipe",
    "Contact the event team",
    "\u8BF7\u8054\u7CFB\u6D3B\u52A8\u56E2\u961F"
  ],
  tracking: ["Rastreio", "Tracking", "\u7269\u6D41\u5355\u53F7"],
  roundEarned: ["Nesta rodada: +{count} pontos", "This round: +{count} campaign points", "\u672C\u8F6E\u83B7\u5F97 +{count} \u6D3B\u52A8\u79EF\u5206"],
  goFarm: ["Alimentar o filhote", "Visit my turkey", "\u53BB\u5582\u517B\u706B\u9E21"],
  successExchange: [
    "Ra\xE7\xE3o adicionada ao celeiro!",
    "Feed added to your barn!",
    "\u9972\u6599\u5DF2\u5230\u8D26\uFF01"
  ],
  successFeed: [
    "Seu filhote est\xE1 crescendo!",
    "Your turkey is growing!",
    "\u706B\u9E21\u6B63\u5728\u957F\u5927\uFF01"
  ],
  successClaim: ["Pedido registrado.", "Claim registered.", "\u7533\u9886\u767B\u8BB0\u6210\u529F\u3002"],
  loading: [
    "Preparando o Natal\u2026",
    "Getting Christmas ready\u2026",
    "\u6B63\u5728\u5E03\u7F6E\u5723\u8BDE\u6D3B\u52A8\u2026"
  ],
  retry: ["Tentar novamente", "Try again", "\u91CD\u8BD5"],
  celebrate: ["Feliz Natal!", "Merry Christmas!", "\u5723\u8BDE\u5FEB\u4E50\uFF01"],
  campaignUnavailable: [
    "A campanha est\xE1 indispon\xEDvel. Tente novamente.",
    "The campaign is unavailable. Please try again.",
    "\u6D3B\u52A8\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"
  ],
  invalidAmount: [
    "Escolha uma quantidade v\xE1lida.",
    "Choose a valid quantity.",
    "\u8BF7\u9009\u62E9\u6709\u6548\u4EFD\u6570\u3002"
  ],
  previewOnly: [
    "O presente de teste s\xF3 est\xE1 dispon\xEDvel na fase de testes.",
    "The test gift is only available during testing.",
    "\u4F53\u9A8C\u79EF\u5206\u4EC5\u6D4B\u8BD5\u671F\u95F4\u53EF\u9886\u53D6\u3002"
  ],
  campaignEnded: [
    "O prazo para trocar e alimentar terminou.",
    "The exchange and feeding period has ended.",
    "\u5151\u6362\u548C\u5582\u517B\u65F6\u95F4\u5DF2\u622A\u6B62\u3002"
  ],
  notEnoughPoints: [
    "Voc\xEA ainda n\xE3o tem pontos suficientes.",
    "You don\u2019t have enough points yet.",
    "\u79EF\u5206\u4E0D\u8DB3\u3002"
  ],
  notEnoughFeed: [
    "Voc\xEA precisa de mais ra\xE7\xE3o.",
    "You need more feed.",
    "\u9972\u6599\u4E0D\u8DB3\u3002"
  ],
  turkeyGrown: ["Seu filhote j\xE1 cresceu. Confira sua posi\xE7\xE3o no ranking semanal.", "Your turkey is fully grown. Check your weekly rank.", "\u706B\u9E21\u5DF2\u517B\u6210\uFF0C\u8BF7\u67E5\u770B\u9996\u6B21\u8FBE\u6210\u7684\u5468\u699C\u540D\u6B21\u3002"],
  turkeyNotGrown: [
    "Complete o crescimento primeiro.",
    "Complete growth first.",
    "\u8BF7\u5148\u5B8C\u6210\u517B\u6210\u3002"
  ],
  claimClosed: [
    "O per\xEDodo de pedidos est\xE1 fechado.",
    "The claim period is closed.",
    "\u7533\u9886\u65F6\u95F4\u672A\u5F00\u653E\u6216\u5DF2\u7ED3\u675F\u3002"
  ],
  claimDetailsRequired: [
    "Informe nome, telefone v\xE1lido e aceite o uso do contato.",
    "Enter your name, valid phone number, and contact consent.",
    "\u8BF7\u586B\u5199\u59D3\u540D\u3001\u6709\u6548\u624B\u673A\u53F7\uFF0C\u5E76\u540C\u610F\u8054\u7CFB\u65B9\u5F0F\u7528\u9014\u3002"
  ],
  contactAlreadyUsed: [
    "Este contato j\xE1 tem um pedido nesta fase.",
    "This contact already has a claim in this phase.",
    "\u8BE5\u8054\u7CFB\u65B9\u5F0F\u5728\u672C\u9636\u6BB5\u5DF2\u6709\u7533\u9886\u8BB0\u5F55\u3002"
  ]
};
function ct(lang, key, values = {}) {
  const item = words[key];
  let text = item ? item[lang === "pt" ? 0 : lang === "en" ? 1 : 2] : key;
  for (const [k, v] of Object.entries(values))
    text = text.replaceAll("{" + k + "}", String(v));
  return text;
}
var keys = Object.keys(words);

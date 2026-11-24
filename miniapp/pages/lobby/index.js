const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  activity = require('../farm/controller'), words = require('../../utils/labels');
Page(Object.assign({}, activity, {
  data: Object.assign({},activity.data,{
    embedded: true, modal: '', draftName: '',
    name: "",
    code: "",
    size: 2,
    capacity: 4,
    rounds: 1,
    busy: false,
    error: "",
    languages: ["Português (BR)", "English", "中文"],
    sizes: [2, 3, 4],
    roundOptions: [1, 3, 5],
  }),
  onLoad: function () {
    activity.onLoad.call(this, {});
    this.setData({
      name:
        (getApp().globalData.session || {}).name ||
        p.api().getStorageSync("ono.name") ||
        "",
    });
  },
  onShow: function () {
    var app = getApp();
    ui.setup(this);
    var token = app.globalData.pendingInvite;
    if (token) {
      app.globalData.pendingInvite = null;
      p.api().navigateTo({
        url: "/pages/invite/index?token=" + token,
        fail: function () {
          app.globalData.pendingInvite = token;
        },
      });
      return;
    }
    var saved = p.api().getStorageSync("ono.room");
    this.setData({ savedRoom: saved || '', signedIn: !!app.globalData.session });
    this.updateSizes();
    if (this.data.signedIn) activity.onShow.call(this);
    else {
      var self = this;
      client.request('/v1/campaign').then(function(result){self.publicConfig = result.config;self.updateSizes();}).catch(function(){});
    }
  },
  updateSizes: function () {
    var lang=this.data.lang, config=this.publicConfig, next={sizeLabels:this.data.sizes.map(function(count){return words.t(lang,count===2?'matchDuel':'matchSizeLabel',{count:count});})};
    if(config && !this.data.signedIn){next.rewardRule=words.t(lang,'friendsPointsRule',{bonus:config.winBonus,cap:config.gameDailyCap});next.rewardTiers=config.friendRewards.map(function(points,index){return words.t(lang,'roomRewardTier',{points:points,count:index+2});});}
    this.setData(next);
  },
  refresh: function () { if(this.data.signedIn && !this.data.modal) return activity.refresh.call(this); },
  onPollError: function (error) {
    if (error.message === 'sessionExpired') {
      activity.onHide.call(this);
      getApp().clearSession();
      this.setData({signedIn:false,farm:null,quota:'',modal:'name',draftName:this.data.name});
    }
    ui.fail(this,error);
  },
  showModal: function(e){ this.setData({modal:e.currentTarget.dataset.modal,draftName:this.data.name,error:''}); },
  closeModal: function(){ if(!this.data.busy){this.returnTo='';this.setData({modal:'',error:''});} },
  matchSize: function(e){this.setData({size:this.data.sizes[Number(e.detail.value)]});},
  changeLang: function (e) {
    ui.changeLang(this, e);
    this.updateSizes();
  },
  nameInput: function (e) {
    this.setData({ draftName: e.detail.value });
  },
  codeInput: function (e) {
    this.setData({ code: e.detail.value.replace(/[^0-9]/g, "").slice(0, 6) });
  },
  select: function (e) {
    var next = {};
    next[e.currentTarget.dataset.field] = Number(e.currentTarget.dataset.value);
    this.setData(next);
  },
  save: function () {
    var self = this;
    ui.busy(this, function () {
      return getApp()
        .ensureSession(self.data.draftName)
        .then(function () {
          return client.game({ op: "rename", name: self.data.draftName });
        })
        .then(function (r) {
          var app = getApp();
          app.globalData.session.name = r.name;
          p.api().setStorageSync("ono.session", app.globalData.session);
          p.api().setStorageSync("ono.name", r.name);
          var first = !self.data.signedIn;
          self.setData({ name: r.name, modal:self.returnTo || '', signedIn:true });
          self.returnTo='';
          if (first && getCurrentPages().slice(-1)[0] === self) activity.onShow.call(self);
        });
    });
  },
  enter: function (e) {
    if (!this.data.signedIn && !this.data.name) { this.returnTo=this.data.modal;this.setData({modal:'name'}); return; }
    var self = this;
    ui.busy(this, function () {
      return getApp()
        .ensureSession(self.data.name)
        .then(function () {
          var op = e.currentTarget.dataset.op;
          return client.game(
            op === "join"
              ? { op: op, code: self.data.code }
              : {
                  op: op,
                  capacity:
                    op === "match" ? self.data.size : self.data.capacity,
                  rounds: self.data.rounds,
                },
          );
        })
        .then(function (r) {
          getApp().openRoom(r.room);
        });
    });
  },
  resume: function () {
    var self = this;
    ui.busy(this, function () {
      return getApp()
        .ensureSession(self.data.name)
        .then(function () {
          return client.game({ op: "state", room: self.data.savedRoom });
        })
        .then(function (r) {
          getApp().openRoom(r.room);
        })
        .catch(function (e) {
          if (
            ["roomMissing", "notMember", "roomClosed"].indexOf(e.message) >= 0
          ) {
            getApp().rememberRoom(null);
            self.setData({ savedRoom: "" });
          }
          throw e;
        });
    });
  },
  farm: function () {
    if (!this.data.signedIn) {this.setData({modal:'name'});return;}
    if(this.data.farm){this.focus=true;this.centerPet();return;}
    var self = this;
    ui.busy(this, function () {
      return getApp()
        .ensureSession(self.data.name)
        .then(function () {
          p.api().navigateTo({ url: "/pages/farm/index?focus=pet" });
        });
    });
  },
  rules: function () {
    p.api().navigateTo({ url: "/pages/rules/index" });
  },
  leaderboard: function () {
    p.api().navigateTo({ url: "/pages/leaderboard/index" });
  },
}));

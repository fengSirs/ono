const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  features = require("../../utils/features"),
  activity = require('../farm/controller'), words = require('../../utils/labels');
Page(Object.assign({}, activity, {
  data: Object.assign({},activity.data,{
    embedded: true, modal: '', draftName: '', authenticating: false, authError: '',
    features: features,
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
        p.storage.get("ono.name") ||
        "",
    });
  },
  onShow: function () {
    var app = getApp();
    ui.setup(this);
    var token = app.globalData.pendingInvite;
    if (token) {
      app.globalData.pendingInvite = null;
      p.navigateTo({
        url: "/pages/invite/index?token=" + token,
        fail: function () {
          app.globalData.pendingInvite = token;
        },
      });
      return;
    }
    var saved = p.storage.get("ono.room");
    this.setData({ savedRoom: saved || '', signedIn: !!app.globalData.session });
    this.updateSizes();
    if (this.data.signedIn) activity.onShow.call(this);
    else {
      var self = this;
      client.request('/v1/campaign').then(function(result){self.publicConfig = result.config;self.updateSizes();}).catch(function(){});
      this.syncAuth().catch(function () {});
    }
  },
  syncAuth: function () {
    var self = this,
      auth = getApp().ensureSession();
    if (!auth || this.data.signedIn) return Promise.resolve();
    this.setData({ authenticating: true });
    return auth.then(function (session) {
      if (getCurrentPages().slice(-1)[0] !== self) return session;
      self.setData({
        authenticating: false,
        signedIn: true,
        authError: '',
        name: session.name,
        draftName: self.data.draftName || session.name,
      });
      if (!self.data.modal) activity.onShow.call(self);
      return session;
    }).catch(function (error) {
      if (getCurrentPages().slice(-1)[0] === self) {
        var key = error.message || 'loginFailed',
          message = words.t(getApp().globalData.lang, key);
        if (message === key) message = words.t(getApp().globalData.lang, 'loginFailed');
        self.setData({ authenticating: false, authError: message, error: '' });
      }
      throw error;
    });
  },
  retryAuth: function () {
    if (this.data.authenticating) return;
    this.setData({ authError: '' });
    this.syncAuth().catch(function () {});
  },
  onServerProfile: function (profile) {
    if (!profile || !profile.name || !this.data.signedIn) return;
    this.setData({
      name: profile.name,
      draftName: this.data.draftName || profile.name,
    });
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
      this.setData({signedIn:false,farm:null,quota:'',modal:''});
      this.syncAuth().catch(function () {});
      error.message = 'reconnecting';
    }
    ui.fail(this,error);
  },
  showModal: function(e){
    var modal = e.currentTarget.dataset.modal;
    if (modal === 'name' && !this.data.signedIn) {
      if (this.data.authenticating) return;
      this.syncAuth().catch(function () {});
      return;
    }
    this.setData({modal:modal,draftName:this.data.name,error:''});
  },
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
        .rename(self.data.draftName)
        .then(function (r) {
          var first = !self.data.signedIn;
          self.setData({ name: r.name, modal:self.returnTo || '', signedIn:true });
          self.returnTo='';
          if (first && getCurrentPages().slice(-1)[0] === self) activity.onShow.call(self);
        });
    });
  },
  enter: function (e) {
    if (!this.data.signedIn) {
      if (this.data.authenticating) return;
      this.syncAuth().catch(function () {});
      return;
    }
    var self = this;
    ui.busy(this, function () {
      return getApp()
        .ensureSession()
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
        .ensureSession()
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
    if (this.data.authenticating) return;
    if (!this.data.signedIn) {
      this.syncAuth().catch(function () {});
      return;
    }
    if(this.data.farm){this.focus=true;this.centerPet();return;}
    var self = this;
    ui.busy(this, function () {
      return getApp()
        .ensureSession()
        .then(function () {
          p.navigateTo({ url: "/pages/farm/index?focus=pet" });
        });
    });
  },
  rules: function () {
    p.navigateTo({ url: "/pages/rules/index" });
  },
  leaderboard: function () {
    if (!features.leaderboard) return;
    p.navigateTo({ url: "/pages/leaderboard/index" });
  },
}));

Component({
  properties: {
    card: Object,
    selected: Boolean,
    disabled: Boolean,
    compact: Boolean,
  },
  methods: {
    tap: function () {
      this.triggerEvent("choose", { id: this.properties.card.id });
    },
  },
});

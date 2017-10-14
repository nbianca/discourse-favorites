export default function() {
  this.route('discovery', { path: '/', resetNamespace: true }, function() {
    this.route('favorites', { path: '/favorites' });
    Discourse.Site.currentProp('filters').forEach(filter => {
      this.route(filter + 'Favorites', { path: '/favorites/' + filter });
    });
  });
}

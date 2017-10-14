import buildTopicRoute from 'discourse/routes/build-topic-route';
import DiscoverySortableController from 'discourse/controllers/discovery-sortable';
import { customNavItemHref } from 'discourse/models/nav-item';
import { addExtraDropItem, selectedDropItem } from 'discourse/components/category-drop';

function buildFavoriteRoute(filter) {
  return buildTopicRoute('favorites/' + filter, {
    beforeModel() {
      this.controllerFor('navigation/default').set('filterMode', filter);
    }
  });
}

export default {
  name: "favorites-routes",

  initialize(container) {

    /**
     * This feature is available only to logged users.
     */
    const currentUser = container.lookup('current-user:main');
    if (!currentUser) {
      return;
    }

    /**
     * Create controllers for favorites.
     */
    Discourse[`DiscoveryFavoritesController`] = DiscoverySortableController.extend();
    Discourse[`DiscoveryFavoritesRoute`] = buildFavoriteRoute('latest');

    Discourse.Site.current().get('filters').forEach(filter => {
      const filterCapitalized = filter.capitalize();
      Discourse[`Discovery${filterCapitalized}FavoritesController`] = DiscoverySortableController.extend();
      Discourse[`Discovery${filterCapitalized}FavoritesRoute`] = buildFavoriteRoute(filter);
    });

    /**
     * Definition of the extra cateogry that will be shown in the category drop.
     */
    const favoritesExtraCategory = {
      href: '/favorites/',
      label: I18n.t('favorites.category'),
      icon: 'star',
      id: 'favorites',
    };

    /**
     * Add "Favorites" category.
     */
    addExtraDropItem(favoritesExtraCategory);
    selectedDropItem(function(items) {
      if (container.lookup('router:main').get('currentURL').startsWith('/favorites/')) {
        return favoritesExtraCategory;
      }
      return null;
    });

    /**
     * Overwrite filter URLs from the navigation bar.
     */
    customNavItemHref(function(navItem) {
      if (['latest', 'new', 'unread'].includes(navItem.get('name')) && container.lookup('router:main').get('currentURL').startsWith('/favorites/')) {
        return '/favorites/' + navItem.get('name');
      }
      return null;
    });
  }
};

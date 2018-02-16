import buildTopicRoute from 'discourse/routes/build-topic-route';
import CategoryDropComponent from 'select-kit/components/category-drop';
import DiscoverySortableController from 'discourse/controllers/discovery-sortable';
import favorites from 'discourse/plugins/discourse-favorites/lib/favorites';
import { customNavItemHref } from 'discourse/models/nav-item';
import { default as computed } from 'ember-addons/ember-computed-decorators';

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
     * Fetch user's favorites.
     */
    favorites._getFavorites();

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
     * Add "Favorites" category.
     */
    CategoryDropComponent.reopen({

      @computed("allCategoriesUrl", "allCategoriesLabel", "noCategoriesUrl", "noCategoriesLabel")
      collectionHeader(allCategoriesUrl, allCategoriesLabel, noCategoriesUrl, noCategoriesLabel) {
        let ret = this._super(allCategoriesUrl, allCategoriesLabel, noCategoriesUrl, noCategoriesLabel);
        if (!this.get("subCategory") && favorites.favorites.size > 0) {
          ret += `
            <a href="/favorites/" class="category-filter">
              <i class="fa fa-star"></i> ${I18n.t('favorites.category')}
            </a>
          `.htmlSafe();
        }
        return ret;
      },

      computeHeaderContent() {
        if (!this.get("subCategory")) {
          if (Discourse.__container__.lookup('router:main').get('currentURL').startsWith('/favorites/')) {
            let content = this.baseHeaderComputedContent();
            content.label = '<i class="fa fa-star"></i> ' + I18n.t('favorites.category');
            return content;
          }
        }

        return this._super();
      }
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

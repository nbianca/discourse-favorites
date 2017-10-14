import favorites from 'discourse/plugins/discourse-favorites/lib/favorites';
import Category from 'discourse/models/category';

export default {

  setupComponent(args, component) {
    favorites.get(function (categoryIds) {
      component.set('selectedCategories', Category.findByIds(categoryIds));
      component.addObserver('selectedCategories', function() {
        favorites.set(component.get('selectedCategories').map(category => category.id));
      });
    });
  },

};

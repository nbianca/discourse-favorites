# name: discourse-favorites
# about: Adds an option to track your favorites categories.
# version: 0.1
# authors: Bianca Nenciu
# url: https://github.com/discourse/discourse-favorites/

enabled_site_setting :favorites_enabled

register_asset "stylesheets/favorites.scss"

after_initialize do

  require_dependency "application_controller"
  require_dependency "plugin_store"

  module ::Favorites
    PLUGIN_NAME = "favorites".freeze

    class Engine < ::Rails::Engine
      engine_name Favorites::PLUGIN_NAME
      isolate_namespace Favorites
    end
  end

  class Favorites::Favorites
    class << self

      def get(user_id)
        PluginStore.get(Favorites::PLUGIN_NAME, user_id) || []
      end

      def set(user_id, category_ids)
        category_ids.uniq!

        if !category_ids.empty?
          PluginStore.set(Favorites::PLUGIN_NAME, user_id, category_ids)
        else
          PluginStore.remove(Favorites::PLUGIN_NAME, user_id)
        end

        category_ids
      end

      def add(user_id, category_id)
        category_ids = get(user_id)
        category_ids.push(category_id)

        set(user_id, category_ids)
      end

      def remove(user_id, category_id)
        category_ids = get(user_id)
        category_ids.delete(category_id)

        set(user_id, category_ids)
      end
    end
  end

  class Favorites::FavoritesController < ::ApplicationController
    requires_plugin Favorites::PLUGIN_NAME

    before_action :ensure_logged_in
    skip_before_action :check_xhr

    def get
      favorites = Favorites::Favorites.get(current_user.id)

      render json: favorites
    end

    def set
      category_ids = params.require(:category_ids)

      favorites = Favorites::Favorites.set(current_user.id, category_ids)
      render json: favorites
    end

    def add
      category_id = params.require(:category_id)

      favorites = Favorites::Favorites.add(current_user.id, category_id)
      render json: favorites
    end

    def remove
      category_id = params.require(:category_id)

      favorites = Favorites::Favorites.remove(current_user.id, category_id)
      render json: favorites
    end
  end

  class Favorites::ListController < ::ListController

    def get_excluded_category_ids(excluded = nil)
      exclude_category_ids = Category.all
      exclude_category_ids = exclude_category_ids.where.not(id: excluded) if excluded
      exclude_category_ids.pluck(:id)
    end

    Discourse.filters.each do |filter|
      define_method("favorite_#{filter}") do |options = nil|
        list_opts = build_topic_list_options
        list_opts.merge!(options) if options
        user = list_target_user

        favorites = Favorites::Favorites.get(user.id)
        list_opts[:exclude_category_ids] = get_excluded_category_ids(favorites)

        list = TopicQuery.new(user, list_opts).public_send("list_#{filter}")

        list.more_topics_url = construct_url_with(:next, list_opts)
        list.prev_topics_url = construct_url_with(:prev, list_opts)

        respond_with_list(list)
      end
    end
  end

  Favorites::Engine.routes.draw do
    get "/get"    => "favorites#get"
    put "/set"    => "favorites#set"
    put "/add"    => "favorites#add"
    put "/remove" => "favorites#remove"

    get "/"       => "list#favorite_latest"
    Discourse.filters.each do |filter|
      get "#{filter}" => "list#favorite_#{filter}", as: "favorite_#{filter}"
    end
  end

  Discourse::Application.routes.append do
    mount ::Favorites::Engine, at: "/favorites"
  end

end

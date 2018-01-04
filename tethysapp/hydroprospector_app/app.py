from tethys_sdk.base import TethysAppBase, url_map_maker


class HydroprospectorApp(TethysAppBase):
    """
    Tethys app class for Hydroprospector App.
    """

    name = 'Hydroprospector App'
    index = 'hydroprospector_app:home'
    icon = 'hydroprospector_app/images/icon.gif'
    package = 'hydroprospector_app'
    root_url = 'hydroprospector-app'
    color = '#27ae60'
    description = 'Place a brief description of your app here.'
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='hydroprospector-app',
                controller='hydroprospector_app.controllers.home'
            ),
            UrlMap(
                name='run-wd',
                url='hydroprospector-app/run-wd',
                controller='hydroprospector_app.controllers.run_wd'
            ),
        )

        return url_maps

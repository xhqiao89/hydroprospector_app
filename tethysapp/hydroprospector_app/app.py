from tethys_sdk.base import TethysAppBase, url_map_maker


class HydroprospectorApp(TethysAppBase):
    """
    Tethys app class for Hydroprospector App.
    """

    name = 'HydroProspector for Dominican Republic'
    index = 'hydroprospector_app:home'
    icon = 'hydroprospector_app/images/damicon.png'
    package = 'hydroprospector_app'
    root_url = 'hydroprospector-app'
    color = '#8033ff'
    description = 'This app calculates the storage capacity curve of a designed dam in Dominican Republic country.'
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
            UrlMap(
                name='run-sc',
                url='hydroprospector-app/run-sc',
                controller='hydroprospector_app.controllers.run_sc'
            )
        )

        return url_maps

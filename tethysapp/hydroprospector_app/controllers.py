from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import Button,TextInput
from owslib.wps import WebProcessingService
from owslib.wps import printInputOutput
from owslib.wps import monitorExecution

@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    damHeight = TextInput(display_text='Dam Height (m):',
                           name="damHeight",
                           initial="50",
                           disabled=False,
                           attributes="")
    interval = TextInput(display_text='Interval :',
                           name="interval",
                           initial="5",
                           disabled=False,
                           attributes="")
    btnCalc = Button(display_text="Calculate Storage Capacity Curve",
                      name="btnCalc",
                      attributes="onclick=run_sc_calc()",
                      submit=False)

    context = {
        'damHeight': damHeight,
        'interval':interval,
        'btnCalc': btnCalc
    }


    return render(request, 'hydroprospector_app/home.html', context)

def run_wd(request):

    message = ""

    try:
        if request.GET:
            xlon = request.GET.get("xlon", None)
            ylat = request.GET.get("ylat", None)

            # Run watersheddelineationprocess service
            wps = WebProcessingService('http://127.0.0.1:8000/tethys_wps/?', verbose=False)

            processid = 'watersheddelineationprocess'

            inputs=[("outlet_x",xlon),
                    ("outlet_y",ylat)]

            execution = wps.execute(processid, inputs)
            monitorExecution(execution)
            # extract watershed geojson
            watershed_GEOJSON =  execution.processOutputs[0].data[0]
            snappoint_GEOJSON = execution.processOutputs[1].data[0]
            status = execution.status

            # Check results
            if watershed_GEOJSON is not None:
                message += str(status)
            else:
                message += str(status)
        else:
            raise Exception("Please call this service in a GET request.")

    except Exception as ex:
        message = ex.message

    return JsonResponse({"watershed_GEOJSON":watershed_GEOJSON,
                        "snappoint_GEOJSON":snappoint_GEOJSON,
                        "message":message})

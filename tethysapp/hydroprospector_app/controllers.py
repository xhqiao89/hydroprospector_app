from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import Button,TextInput
from owslib.wps import WebProcessingService
from owslib.wps import monitorExecution

# from multiprocessing import Process
# import os

# this part just for multiprocessing test
# def info(title):
#     print title
#     print 'module name:', __name__
#     if hasattr(os, 'getppid'):  # only available on Unix
#         print 'parent process:', os.getppid()
#     print 'process id:', os.getpid()
#
#
#
# def myfunc():
#     print "myfunc start---------------"
#     info("myfunc")
#     import time
#     time.sleep(60)
#     print "myfunc end-------------"
#this part just for multiprocessing test


@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    damHeight = TextInput(display_text='Dam Height (m):',
                           name="damHeight",
                           initial="100",
                           disabled=False,
                           attributes="")
    interval = TextInput(display_text='Interval :',
                           name="interval",
                           initial="10",
                           disabled=False,
                           attributes="")
    btnDelin = Button(display_text="Delinate Watershed",
                      name="btnDelin",
                      attributes="onclick=run_wd_calc()",
                      submit=False)
    btnCalc = Button(display_text="Calculate Storage Capacity Curve",
                      name="btnCalc",
                      attributes="onclick=run_sc_calc()",
                      submit=False)

    context = {
        'damHeight': damHeight,
        'interval':interval,
        'btnDelin':btnDelin,
        'btnCalc': btnCalc
    }

    # this part just for multiprocessing test
    # info("Main Line")
    # print "Pre: Process------------------------"
    # p = Process(target=myfunc)
    # # p.daemon = True
    # p.start()
    #
    # print "POST: Process-----------------------"


    return render(request, 'hydroprospector_app/home.html', context)

def run_wd(request):

    message = ""

    try:
        if request.GET:
            xlon = request.GET.get("xlon", None)
            ylat = request.GET.get("ylat", None)

            # Run watersheddelineationprocess service
            #wps = WebProcessingService('https://tethys-staging.byu.edu/tethys_wps/?', verbose=False)
            wps = WebProcessingService('http://127.0.0.1:8000/tethys_wps/?', verbose=False)

            processid = 'watersheddelineationprocess'

            inputs=[("outlet_x",xlon),
                    ("outlet_y",ylat)]

            execution = wps.execute(processid, inputs, output="message")
            monitorExecution(execution)
            # extract watershed geojson
            watershed_GEOJSON =  execution.processOutputs[1].data[0]
            snappoint_GEOJSON = execution.processOutputs[2].data[0]
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
        print ex
        print ex.message

    return JsonResponse({"watershed_GEOJSON":watershed_GEOJSON,
                        "snappoint_GEOJSON":snappoint_GEOJSON,
                        "message":message})


def run_sc(request):

    message = ""

    try:
        if request.POST:
            outlet_x = request.POST.get("outlet_x", None)
            outlet_y = request.POST.get("outlet_y", None)
            dam_height = request.POST.get("dam_height", None)
            watershed_geojson = request.POST.get("watershed_geojson", None)

            # Run reservoircalculation service
            #wps = WebProcessingService('https://tethys-staging.byu.edu/tethys_wps/?', verbose=False)
            wps = WebProcessingService('http://127.0.0.1:8000/tethys_wps/?', verbose=False)

            processid = 'reservoircalculationprocess'

            inputs=[("point_x",outlet_x),
                    ("point_y",outlet_y),
                    ("water_level", dam_height),
                    ("max_boundary", watershed_geojson)]

            execution = wps.execute(processid, inputs, output="lake_volume")
            monitorExecution(execution)
            # extract watershed geojson
            lake_GEOJSON =  execution.processOutputs[1].data[0]
            lake_volume = execution.processOutputs[0].data[0]
            status = execution.status

            # Check results
            if lake_GEOJSON is not None:
                message += str(status)
            else:
                message += str(status)
        else:
            raise Exception("Please call this service in a POST request.")

    except Exception as ex:
        message = ex.message

    return JsonResponse({"lake_GEOJSON":lake_GEOJSON,
                        "lake_volume":lake_volume,
                        "message":message})

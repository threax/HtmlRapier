//Rest Functions
htmlrest.rest = htmlrest.rest || {

}

htmlrest.rest.post = function (url, data, success, fail)
{
    htmlrest.rest.ajax(url, 'post', data, success, fail);
}

htmlrest.rest.put = function (url, data, success, fail)
{
    htmlrest.rest.ajax(url, 'put', data, success, fail);
}

htmlrest.rest.delete = function (url, data, success, fail)
{
    htmlrest.rest.ajax(url, 'delete', data, success, fail);
}

htmlrest.rest.get = function (url, success, fail)
{
    if (fail === undefined)
    {
        fail = success;
    }

    $.ajax({
        method: 'get',
        url: url,
        cache: false,
        success: function (resultData, textStatus, jqXHR)
        {
            if (success !== undefined)
            {
                success(resultData);
            }
        },
        error: function (jqXHR, textStatus, errorThrown)
        {
            if (fail !== undefined && fail !== null)
            {
                fail(jqXHR.responseJSON);
            }
        }
    });
}

htmlrest.rest.ajax = function (url, method, data, success, fail)
{
    if (fail === undefined)
    {
        fail = success;
    }

    var request = {
        method: method,
        url: url,
        contentType: 'application/json; charset=UTF-8',
        data: JSON.stringify(data),
        success: function (resultData, textStatus, jqXHR)
        {
            if (success !== undefined)
            {
                success(resultData);
            }
        },
        error: function (jqXHR, textStatus, errorThrown)
        {
            if (fail !== undefined && fail !== null)
            {
                fail(jqXHR.responseJSON);
            }
        }
    };

    $.ajax(request);
}

htmlrest.rest.upload = function (url, data, success, fail)
{
    //This does sound strange
    if (fail === undefined)
    {
        fail = success;
    }

    var formData = new FormData();
    formData.append('file', data);

    var request = {
        method: 'post',
        url: url,
        contentType: false,
        processData: false,
        data: formData,
        success: function (resultData, textStatus, jqXHR)
        {
            if (success !== undefined)
            {
                success(resultData, true);
            }
        },
        error: function (jqXHR, textStatus, errorThrown)
        {
            if (fail !== undefined && fail !== null)
            {
                fail(jqXHR.responseJSON, false);
            }
        }
    };

    $.ajax(request);
}
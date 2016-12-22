var playlists = new function() {
    this.tracks = [];
    this.clickedButtonsQueue = [];
    this.access_token = '';
    this.audio_features_url = '';
    this.count = 0;
    this.features = ['acousticness', 'danceability', 'duration_ms', 'energy',
        'instrumentalness', 'key', 'liveness', 'loudness', 'mode',
        'speechiness', 'tempo', 'time_signature', 'valence'];
    this.labels = ['acousticness', 'danceability', 'duration_min', 'energy',
        'instrumentalness', 'key', 'liveness', 'loudness', 'mode',
        'speechiness', 'tempo', 'time_signature', 'valence'];
    this.graphId = '';
    this.buttonId = '';
    this.userId = '';
    this.playlistPlaceholder = '';
    this.playlistTemplate = '';
    this.trackPlaceholder = '';
    this.trackTemplate = '';
    this.trackHolder = '';
    this.trackList = '';

    this.init  = function (userId, access_token, buttonId, graphId,
                           pPlaceholder, pTemplate, tPlaceholder, tTemplate,
                           tHolder, tList) {
        this.userId = userId;
        this.access_token = access_token;
        this.buttonId = buttonId;
        this.graphId = graphId;
        this.playlistPlaceholder = pPlaceholder;
        this.playlistTemplate = pTemplate;
        this.trackPlaceholder = tPlaceholder;
        this.trackTemplate = tTemplate;
        this.trackHolder = tHolder;
        this.trackList = tList;

        // hide playlists  until #playlists button is clicked
        $(playlists.buttonId).hide();
    };

    this.main = function () {
        $.ajax({
            url: "https://api.spotify.com/v1/users/" + playlists.userId +
            "/playlists",
            headers: {
                Authorization: "Bearer " + playlists.access_token
            },
            accepts: "application/json",
            type: "GET",
            success: function (data) {
                // generate playlist buttons
                playlists.playlistPlaceholder.innerHTML =
                    playlists.playlistTemplate(data.items);

                for (var i=0; i < data.items.length; ++i) {
                    // create on click action for each button generated
                    $('#' + data.items[i].id).on('click', function(i) {
                        return function () {
                            $(playlists.buttonId).hide();
                            playlists.clearPlaylistVars();
                            $(playlists.trackList).empty();
                            $(playlists.trackHolder).show();

                            if ($(this).attr("class") != 'btn btn-primary active') {
                                $(this).attr('class', 'btn btn-primary active');
                                playlists.clickedButtonsQueue.push(this);
                            }
                            else {
                                $(this).attr('class', 'btn btn-primary');
                                playlists.clickedButtonsQueue.splice(this, 1);
                                //return;
                            }


                            // if more than two buttons are active, FIFO
                            if (playlists.clickedButtonsQueue.length > 1    ) {
                                $(playlists.clickedButtonsQueue.shift()).attr(
                                    'class', 'btn btn-primary');
                            }


                            $.ajax({
                                url: "https://api.spotify.com/v1/users/" +
                                playlists.userId + "/playlists/" +
                                data.items[i].id + "/tracks",
                                headers: {Authorization: "Bearer " +
                                playlists.access_token},
                                accepts: "application/json",
                                type: "GET",
                                success: function (playlistData) {
                                    for (var i = 0; i < playlistData.items.length; ++i) {
                                        playlists.setTrackInfo(playlistData, i);
                                    }
                                    playlists.getAudioFeatures(playlists.audio_features_url, 0);
                                    playlists.getPlaylistRecursive(playlistData);
                                },
                                error: function () {
                                    $(playlists.buttonId).show();
                                    alert("Error retrieving tracks");
                                }
                            });
                        };
                    }(i));
                }
            },
            error: function (data) {
                // if the div id=tracks is empty show error message
                if (data.next) {
                    $(playlists.trackHolder).prepend("<h3>No tracks retrieved</h3>");
                }
            }
        });
    };

    this.clearPlaylistVars = function () {
        playlists.tracks =[];
        playlists.tracks.danceability = [];
        playlists.tracks.energy = [];
        playlists.tracks.key = [];
        playlists.tracks.loudness = [];
        playlists.tracks.mode = [];
        playlists.tracks.speechiness = [];
        playlists.tracks.acousticness = [];
        playlists.tracks.instrumentalness = [];
        playlists.tracks.liveness = [];
        playlists.tracks.valence = [];
        playlists.tracks.tempo = [];
        playlists.tracks.duration_ms = [];
        playlists.tracks.time_signature = [];
        playlists.audio_features_url = "https://api.spotify.com/v1/audio-features/?ids=";
        playlists.count = 0;
        clearGraph(playlists.graphId);
    };

    this.getAudioFeatures = function (url, begin) {
        $.ajax({
            url: url,
            headers: {
                Authorization: "Bearer " + playlists.access_token
            },
            accepts: "application/json",
            type: "GET",
            success: function (data) {
                for (var i = 0; i < data.audio_features.length; ++i) {
                    playlists.setAudioFeatures(data, i, begin);
                }

                // last iteration of setting audio features
                if ((begin + 100) > playlists.tracks.length) {
                    var mu = [];

                    for (var i=0; i < playlists.features.length; ++i) {
                        mu.push(playlists.tracks[playlists.features[i]].reduce(
                                function (a, b) {
                                return a + b;
                            }, 0) / playlists.tracks.length);
                    }
                    mu[2] = millisToMin(mu[2]);
                    makePolarAreaGraph(mu, playlists.labels, playlists.graphId);
                }
            },
            error: function () {
                alert("error");
            }
        });
    };

    this.getPlaylistRecursive = function (data) {
        if (data.next) {
            $.ajax({
                url: data.next,
                headers: {
                    Authorization: "Bearer " + playlists.access_token
                },
                accepts: "application/json",
                type: "GET",
                success: function (data) {
                    playlists.audio_features_url = "https://api.spotify.com/v1/audio-features/?ids=";
                    var preCount = playlists.count;

                    for (var i = 0; i < data.items.length; ++i) {
                        playlists.setTrackInfo(data, i);
                    }
                    playlists.getAudioFeatures(playlists.audio_features_url,
                        preCount);
                    playlists.getPlaylistRecursive(data);
                },
                error: function (data) {
                    alert("ERROR");
                    if (data.next) {
                        $(playlists.trackHolder).append(
                            "<h3>Error retrieving playlist</h3>");
                    }
                }
            });
        }
        else {
            $(playlists.buttonId).hide();

            playlists.trackPlaceholder.innerHTML = playlists.trackTemplate(
                playlists.tracks);

            $('#track-back').on('click', function() {
                $(playlists.trackHolder).hide();
                $('#' + playlists.graphId).hide();
                $(playlists.buttonId).show();

                for (var i=0; i < playlists.clickedButtonsQueue.length; ++i) {
                    $(playlists.clickedButtonsQueue.pop()).attr(
                        'class', 'btn btn-primary');
                }


            });
        }
    };

    this.setTrackInfo = function (data, index) {
        playlists.audio_features_url += data.items[index].track.id + ",";
        playlists.tracks[playlists.count] = {
            title: data.items[index].track.name,
            artist: data.items[index].track.artists[0].name,
            id: data.items[index].track.id
        };

        playlists.count += 1;
    };

    this.setAudioFeatures = function (data, index) {
        playlists.tracks.danceability.push(
            data.audio_features[index].danceability);
        playlists.tracks.energy.push(
            data.audio_features[index].energy);
        playlists.tracks.key.push(
            data.audio_features[index].key);
        playlists.tracks.loudness.push(
            data.audio_features[index].loudness);
        playlists.tracks.mode.push(
            data.audio_features[index].mode);
        playlists.tracks.speechiness.push(
            data.audio_features[index].speechiness);
        playlists.tracks.acousticness.push(
            data.audio_features[index].acousticness);
        playlists.tracks.instrumentalness.push(
            data.audio_features[index].instrumentalness);
        playlists.tracks.liveness.push(
            data.audio_features[index].liveness);
        playlists.tracks.valence.push(
            data.audio_features[index].valence);
        playlists.tracks.tempo.push(
            data.audio_features[index].tempo);
        playlists.tracks.duration_ms.push(
            data.audio_features[index].duration_ms);
        playlists.tracks.time_signature.push(
            data.audio_features[index].time_signature);
    };

    // onclick
    this.getPlaylists = function () {
        $(playlists.buttonId).show();
        $('#track-list').empty();
        clearGraph('graph');
        playlists.main();
    };

    //onclick
    this.getTrack = function(element) {
        clearGraph(playlists.graphId);
        var idValues = [];

        for (var i=0; i < playlists.features.length; ++i) {
            // the element-id-th value of the array holding features[i]
            // element id corresponds to tracks index in playlists.tracks
            idValues[i] = playlists.tracks[playlists.features[i]][element.id];
        }
        idValues[2] = millisToMin(idValues[2]);
        makePolarAreaGraph(idValues, playlists.labels, playlists.graphId);
    };
};

var library = new function () {
    this.tracks = [];
    this.access_token = '';
    this.audio_features_url = '';
    this.count = 0;
    this.features = ['acousticness', 'danceability', 'duration_ms', 'energy',
        'instrumentalness', 'key', 'liveness', 'loudness', 'mode',
        'speechiness', 'tempo', 'time_signature', 'valence', 'popularity'];
    this.labels = ['acousticness', 'danceability', 'duration_min', 'energy',
        'instrumentalness', 'key', 'liveness', 'loudness', 'mode',
        'speechiness', 'tempo', 'time_signature', 'valence', 'popularity'];
    this.graphId = '';
    this.userId = '';
    this.trackPlaceholder = '';
    this.trackTemplate = '';
    this.trackHolder = '';
    this.trackList = '';

    this.init = function (userId, access_token, graphId,
                          tPlaceholder, tTemplate, tHolder, tList) {
        this.userId = userId;
        this.access_token = access_token;
        this.graphId = graphId;
        this.trackPlaceholder = tPlaceholder;
        this.trackTemplate = tTemplate;
        this.trackHolder = tHolder;
        this.trackList = tList;
        this.audio_features_url = '';
        this.count = 0;

    };

    this.clearLibraryVars = function () {
        library.tracks =[];
        library.tracks.danceability = [];
        library.tracks.energy = [];
        library.tracks.key = [];
        library.tracks.loudness = [];
        library.tracks.mode = [];
        library.tracks.speechiness = [];
        library.tracks.acousticness = [];
        library.tracks.instrumentalness = [];
        library.tracks.liveness = [];
        library.tracks.valence = [];
        library.tracks.tempo = [];
        library.tracks.duration_ms = [];
        library.tracks.time_signature = [];
        library.tracks.popularity = [];
        library.audio_features_url = "https://api.spotify.com/v1/audio-features/?ids=";
        library.count = 0;
        clearGraph(library.graphId);
    };

    this.getAudioFeatures = function (url, begin) {
        $.ajax({
            url: url,
            headers: {
                Authorization: "Bearer " + library.access_token
            },
            accepts: "application/json",
            type: "GET",
            success: function (data) {
                for (var i = 0; i < data.audio_features.length; ++i) {
                    library.setAudioFeatures(data, i, begin);
                }

                // last iteration of setting audio features
                if ((begin + 50) > library.tracks.length) {
                    var mu = [];

                    for (var i=0; i < library.features.length; ++i) {
                        mu.push(library.tracks[library.features[i]].reduce(
                                function (a, b) {
                                return a + b;
                            }, 0) / library.tracks.length);
                    }
                    mu[2] = millisToMin(mu[2]);
                    makePolarAreaGraph(mu, library.labels, library.graphId);
                }
            },
            error: function () {
                alert("error");
            }
        });
    };

    this.setAudioFeatures = function (data, index) {
        library.tracks.danceability.push(
            data.audio_features[index].danceability);
        library.tracks.energy.push(
            data.audio_features[index].energy);
        library.tracks.key.push(
            data.audio_features[index].key);
        library.tracks.loudness.push(
            data.audio_features[index].loudness);
        library.tracks.mode.push(
            data.audio_features[index].mode);
        library.tracks.speechiness.push(
            data.audio_features[index].speechiness);
        library.tracks.acousticness.push(
            data.audio_features[index].acousticness);
        library.tracks.instrumentalness.push(
            data.audio_features[index].instrumentalness);
        library.tracks.liveness.push(
            data.audio_features[index].liveness);
        library.tracks.valence.push(
            data.audio_features[index].valence);
        library.tracks.tempo.push(
            data.audio_features[index].tempo);
        library.tracks.duration_ms.push(
            data.audio_features[index].duration_ms);
        library.tracks.time_signature.push(
            data.audio_features[index].time_signature);
    };

    this.getTrackRecursive = function (data) {
        if (data.next) {
            $.ajax({
                url: "https://api.spotify.com/v1/me/tracks?offset="+
                library.tracks.length +"&limit=50",
                headers: {
                    Authorization: "Bearer " + library.access_token
                },
                accepts: "application/json",
                type: "GET",
                success: function (data) {
                    library.audio_features_url =
                        "https://api.spotify.com/v1/audio-features/?ids=";
                    var preCount = library.count;

                    // for each track (returned in increments of 50)
                    for (var i=0; i < data.items.length; ++i) {
                        library.setTrackInfo(data, i);
                    }
                    library.getAudioFeatures(library.audio_features_url,
                        preCount);

                    library.getTrackRecursive(data);
                },
                error: function () {
                    alert("Unable to get library");
                }
            });
        }
        else {
            library.trackPlaceholder.innerHTML = library.trackTemplate(
                library.tracks);
        }
    };

    this.setTrackInfo = function (data, index) {
        library.audio_features_url += data.items[index].track.id + ',';

        library.tracks[library.count] = {
            added: data.items[index].added_at,
            title: data.items[index].track.name,
            artist: data.items[index].track.artists[0].name,
            id: data.items[index].track.id
        };
        library.tracks.popularity.push(data.items[index].track.popularity);

        library.count += 1;
    };

    this.main = function () {
        $.ajax({
            url: "https://api.spotify.com/v1/me/tracks?offset=0&limit=50",
            headers: {
                Authorization: "Bearer " + library.access_token
            },
            accepts: "application/json",
            type: "GET",
            success: function (data) {
                library.clearLibraryVars();
                console.log(data);
                var preCount = library.count;

                // for each track (returned in increments of 50)
                for (var i=0; i < data.items.length; ++i) {
                    library.setTrackInfo(data, i);
                }
                library.getAudioFeatures(library.audio_features_url, preCount);

                library.getTrackRecursive(data);
            },
            error: function () {
                alert("Unable to get library");
            }
        });
    };

    // onclick
    this.getLibrary = function () {
        $(library.buttonId).show();
        $(playlists.trackHolder).show();
        $('#track-list').empty();
        $('#playlists').empty();
        clearGraph('graph');
        library.main();
    };

    //onclick
    this.getTrack = function(element) {
        clearGraph(library.graphId);
        var idValues = [];

        // if track clicked is value array index
        if (element.id != "-1") {
            $("#-1").css('display', 'inline');

            for (var i = 0; i < library.features.length; ++i) {
                // the element-id-th value of the array holding features[i]
                // element id corresponds to tracks index in library.tracks
                idValues[i] = library.tracks[library.features[i]][element.id];
            }
        }
        // if track clicked represents whole library
        else {
            $("#-1").css('display', 'none');
            for (var i=0; i < library.features.length; ++i) {
                idValues.push(library.tracks[library.features[i]].reduce(
                        function (a, b) { return a + b;
                    }, 0) / library.tracks.length);
            }
        }
        idValues[2] = millisToMin(idValues[2]);
        makePolarAreaGraph(idValues, library.labels, library.graphId);
    };

    this.getDataSet = function () {
        var res = "[";
        for (var it = 0; it < library.count; ++it) {
                    res +=
                        "[\"" + library.tracks[it].title + "\", " +
                           "\"" + library.tracks[it].artist + "\", " +
                            library.tracks.danceability[it] + ", " +
                            library.tracks.energy[it] + ", " +
                            library.tracks.key[it] + ", " +
                            library.tracks.loudness[it] + ", " +
                            library.tracks.mode[it] + ", " +
                            library.tracks.speechiness[it] + ", " +
                            library.tracks.acousticness[it] + ", " +
                            library.tracks.instrumentalness[it] + ", " +
                            library.tracks.liveness[it] + ", " +
                            library.tracks.valence[it] + ", " +
                            library.tracks.tempo[it] + ", " +
                            library.tracks.duration_ms[it] + ", " +
                            library.tracks.time_signature[it] + ", " +
                            library.tracks.popularity[it] + "],";
                }
        res = res.slice(0, -1) + ']';
        var w = window.open();

        var page = "<html>" +
        "<head>" +
        "   <title>Library Data Set</title>" +
        "</head>" +
        "<body><div>" + res + "</div></body></html>";

        $(w.document.body).html(page);

    };
};

function millisToMin(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + (.01 * seconds);
}

function clearGraph(id) {
    $('#' + id).remove();
    $('#canvas-column').append(
        '<canvas id="'+ id + '" class="pull-right"></canvas>');

}

function makePolarAreaGraph(values, labels, id) {
    console.log(values);
    var playlistData = {
        type: 'polarArea',
        datasets: [{
            data: values,
            backgroundColor: [
                "#FF6384",
                "#4BC0C0",
                "#FFCE56",
                "#E7E9ED",
                "#36A2EB",
                "#1a0000",
                "#ff1a8c",
                "#a6ff4d",
                "#a6ff4d",
                "#739900",
                "#ffff00",
                "#ffcccc",
                "#b3d1ff"
            ],
            label: 'My dataset' // for legend
        }],
        labels: labels,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                maintainAspectRatio: true,
                scale: {
                    reverse: false
                }
            }
        }
    };

    var ctx = document.getElementById(id).getContext("2d");
    ctx.canvas.width = 500;
    ctx.canvas.height = 500;
    $('#' + id).show();
    playlists.chart = new Chart(ctx, {
        data: playlistData,
        type: 'polarArea'
    });

}

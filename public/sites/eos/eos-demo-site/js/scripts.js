jQuery(document).ready(function($) {
    //Set isMobile variable for mobile interactions 
    //https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device
    var isMobile = false; //initiate as false
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        isMobile = true;
    }

    if (isMobile) {
        $("#Mobile_Disclaimer").show();
    }

    // Mobile menu toggle
    $("#Mobile_Menu_Toggle").on('click', function() {
        $(this).toggleClass('active');
        $("#Nav_Main").toggleClass('active');
        $('body').toggleClass('menu-open');
    });

    // Close mobile menu when clicking on a link
    $("#Nav_Main a").on('click', function() {
        $("#Mobile_Menu_Toggle").removeClass('active');
        $("#Nav_Main").removeClass('active');
        $('body').removeClass('menu-open');
    });

    // Close mobile menu when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#Header_Main').length) {
            $("#Mobile_Menu_Toggle").removeClass('active');
            $("#Nav_Main").removeClass('active');
            $('body').removeClass('menu-open');
        }
    });

    // Add active class to nav
    // http://www.sweet-web-design.com/wordpress/how-to-add-active-navigation-class-based-on-url-to-menu-item/2401/
    jQuery(function($) {
        var path = window.location.href; // because the 'href' property of the DOM element is the absolute path
        $('#Nav_Main a').each(function() {
            if (this.href === path) {
                $(this).addClass('active');
            }
        });
    });

    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ 
    // F I T V I D
    // https://github.com/davatron5000/FitVids.js
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ 
    $('iframe[src*="youtube"]').parent().fitVids();

    $("#Open-Prototype").on('click', function() {
        $("#Disclaimer").hide();
        sessionStorage.setItem("HiddenDisclaimer", "true");
    });

    var disclaimer_hidden = sessionStorage.getItem("HiddenDisclaimer");
    console.log(disclaimer_hidden);
    if (disclaimer_hidden) {
        $("#Disclaimer").hide();
    }

    // Reload to show disclaimer on homepage
    //check for Navigation Timing API support
    //https://stackoverflow.com/questions/5004978/check-if-page-gets-reloaded-or-refreshed-in-javascript
    if (window.performance) {
        console.info("window.performance works fine on this browser");
    }
    console.info(performance.navigation.type);
    if (performance.navigation.type == performance.navigation.TYPE_RELOAD) {
        console.info("This page is reloaded");
        sessionStorage.clear();
    } else {
        console.info("This page is not reloaded");
    }

    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ 
    // Dropdowns
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ 
    $('.dropdown button').on('click', function() {
        $(this).closest('ul').css('height', '100%');
    });

    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ 
    // C A R O U S E L S // 
    // Slick Carousel
    // Page : About 
    // Location : Timeline Carousel
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ 
    $('#Timeline').slick({
        dots: false,
        prevArrow: false,
        nextArrow: false
    });
    $('#Timeline-2011').on('click', function() {
        $('#Timeline').slick('slickGoTo', 0);
    });
    $('#Timeline-2013').on('click', function() {
        $('#Timeline').slick('slickGoTo', 1);
    });
    $('#Timeline-2014').on('click', function() {
        $('#Timeline').slick('slickGoTo', 2);
    });
    $('#Timeline-2015').on('click', function() {
        $('#Timeline').slick('slickGoTo', 3);
    });
    $('#Timeline-2016a').on('click', function() {
        $('#Timeline').slick('slickGoTo', 4);
    });
    $('#Timeline-2016b').on('click', function() {
        $('#Timeline').slick('slickGoTo', 5);
    });
    $('#Timeline-2017').on('click', function() {
        $('#Timeline').slick('slickGoTo', 6);
    });
    $('#Timeline-2018').on('click', function() {
        $('#Timeline').slick('slickGoTo', 7);
    });
    $('#Timeline-2019').on('click', function() {
        $('#Timeline').slick('slickGoTo', 8);
    });
    $('#Timeline-2020').on('click', function() {
        $('#Timeline').slick('slickGoTo', 9);
    });
    $('#Timeline-2021').on('click', function() {
        $('#Timeline').slick('slickGoTo', 10);
    });
    $('#Timeline-Nav li').on('click', function() {
        $('#Timeline-Nav li').removeClass('active');
        $(this).addClass('active');
    });

    // /// // /// // /// // /// // /// // /// // /// 
    // COMMUNITY PORTAL
    // /// // /// // /// // /// // /// // /// // /// 
    $('.dropdown button').on("click", function() {
        $(this).closest(".dropdown").addClass('active');
    });
    $('.dropdown .close').on("click", function() {
        $('.dropdown').removeClass('active');
    });

    // /// // /// // /// // /// // /// // /// // /// 
    // S I G N U P    F O R M
    // /// // /// // /// // /// // /// // /// // /// 
    // Modal - Membership Types
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ 
    $('#Signup-Membership_Types-Btn').click(function() {
        event.preventDefault();
        $('#Signup-Membership_Types-Modal').fadeToggle();
    });
    $("#Signup-Membership_Types-Modal-Close, .Membership_Types-Btn-Free, .Membership_Types-Btn-Preferred, .Membership_Types-Btn-Premiere").click(function() {
        event.preventDefault();
        $('#Signup-Membership_Types-Modal').fadeToggle();
    });

    // Modal - Membership Agreement
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ
    $('#Signup-Membership_Agreement-Btn').click(function() {
        event.preventDefault();
        $('#Signup-Membership_Agreement-Modal').fadeToggle();
    });
    $("#Signup-Membership_Agreement-Modal-Close, #Signup-Membership_Agreement-Modal-Agree, #Signup-Membership_Agreement-Modal-Cancel").click(function() {
        event.preventDefault();
        $('#Signup-Membership_Agreement-Modal').fadeToggle();
        document.getElementById("Signup-Membership_Agreement-Checkbox").disabled = false;
        document.getElementById("Signup-Membership_Agreement-Checkbox").checked = true;
    });

    // Modal - Website Terms
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ
    $('#Signup-Website_Terms-Btn').click(function() {
        event.preventDefault();
        $('#Signup-Website_Terms-Modal').fadeToggle();
    });
    $("#Signup-Website_Terms-Modal-Close, #Signup-Website_Terms-Modal-Agree, #Signup-Website_Terms-Modal-Cancel").click(function() {
        event.preventDefault();
        $('#Signup-Website_Terms-Modal').fadeToggle();
        document.getElementById("Signup-Website_Terms-Checkbox").checked = true;
        document.getElementById("Signup-Website_Terms-Checkbox").disabled = false;
    });

    // Interactive Form Input Behavior
    // https://codepen.io/nikhil8krishnan/pen/gaybLK
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ
    $('.form').find('.form-control').each(function() {
        var targetItem = $(this).parent();
        if ($(this).val()) {
            $(targetItem).find('label').css({
                'top': '10px',
                'fontSize': '14px',
                'color': 'ADADc9'
            });
        }
    })
    $('.form').find('.form-control').focus(function() {
        $(this).parent('fieldset').addClass('focus');
        $(this).parent().find('label').animate({
            'top': '12px',
            'fontSize': '12px',
            'color': 'ADADc9'
        }, 300);
    })
    $('.form').find('.form-control').blur(function() {
        if ($(this).val().length == 0) {
            $(this).parent('fieldset').removeClass('focus');
            $(this).parent().find('label').animate({
                'top': '25px',
                'fontSize': '18px',
                'color': 'ADADc9'
            }, 300);
        }
    });

    // Signup Radio Buttons
    // ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ ^ ˆ • ˆ
    $("#Signup-Membership_Types > ul > li").click(function() {
        $("#Signup-Membership_Types > ul > li input").prop("checked", false);
        $(this).find('input').prop("checked", true);
    });

    // Modal for Edit Profile
    $('#Profile-Edit-Btn').on('click', function(event) {
        event.preventDefault();
        $('#EditProfileModal').fadeIn();
    });
    $('.modal-close').on('click', function() {
        $('#EditProfileModal').fadeOut();
    });
    // Optional: close modal when clicking outside modal-content
    $('#EditProfileModal').on('click', function(e) {
        if ($(e.target).is('#EditProfileModal')) {
            $('#EditProfileModal').fadeOut();
        }
    });
});

function openReviewTab(reviewItem) {
    var i;
    var x = document.getElementsByClassName("tab-content");
    console.log(x.length);
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
        console.log(x[i]);
        //x[i].classList.remove('active');
    }
    document.getElementById(reviewItem).style.display = "block";
    //document.getElementById(reviewItem).classList.add('active');
}

// Tabs
function openTab(evt, tabContent) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabContent).style.display = "block";
    evt.currentTarget.className += " active";
}

// /// // /// // /// // /// // /// // /// // /// 
// Topics Wheel
// /// // /// // /// // /// // /// // /// // /// 
window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    console.log('derp')
    document.documentElement.style.setProperty('--vh', '${vh}px');
});

jQuery(document).ready(function($) {
    // loop over topics and create a circle for each topic
    const images = topics.map(makeCircle)
    $('#spin-wheel').append(images)

});


const makeCircle = (circleValue, idx) => {
    const { contentColor, heading, textValue, imagesrc } = circleValue;

    // image
    const imagehtml = `<img src="${imagesrc}"></img>`
    const imagecontainer = $(document.createElement("li"))
    const imagelink = '<a href="community.html"></a>'
    imagecontainer.addClass(contentColor)
    const image = $('<img></img>')
    $(image).attr('src', `${imagesrc}`)
    imagecontainer.append(imagehtml)
        .css({
            opacity: 0
        })
    imagecontainer.append(imagelink);
    //images time in 1 by 1
    setTimeout(() => {
        imagecontainer.css({
            opacity: 1
        })
    }, (70 * idx) + 600)

    // image mouseover behavior
    imagecontainer.on('mouseenter', (evt) => {
        // content for mouseover
        $("#spin-wheel li").removeClass('active');
        imagecontainer.addClass('active');
        const headingstuff = $(`<h2>${heading}</h2>`)
        const contentstuff = $(`<p>${textValue}</p>`)
        const linkstuff = $('<a href="community.html"></a>')
        const linkcta = $('<p>Learn More <span class="icon-standard">navigateright</span></p>')
        const contentBox = document.getElementById('spin-text')
        contentBox.innerHTML = '';
        $(contentBox).removeClass().addClass(contentColor)
        $(contentBox).append(headingstuff).append(contentstuff).append(linkstuff).append(linkcta)
    })
    return imagecontainer

}
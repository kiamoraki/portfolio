jQuery(document).ready(function($) {


    //\\ SLIDE RESIZE //\\

    // Setup variables
    $window = $(window);
    $slide = $('.homeSlide');
    $slideTall = $('.homeSlideTall');
    $slideTall2 = $('.homeSlideTall2');
    $body = $('body');
    var headerH = $("#HEADER").outerHeight();

    // Resize sections onload
    adjustWindow();

    // Resize sections with browser size changes
    $(window).resize(function() {
        adjustWindow();
    });

    function adjustWindow() {

        // Get window size
        winH = $window.height();
        winW = $window.width();
        winH = winH - headerH;


        // Set slide height
        $('.slide').each(function() {
            $slide = $(this);
            $slideHeight = $slide.find('.wrapper').outerHeight();

            if ($slideHeight < winH) {
                $slide.height(winH);
            } else {
                $slide.height($slideHeight);
            }
        });

        // Check for window size
        if (winW > 768) {
            // Init Skrollr
            var s = skrollr.init({
                forceHeight: false
            });

            // Refresh Skrollr after resizing our sections
            s.refresh($('.slide'));

        } else {
            // Destroy Skrollr
            var s = skrollr.init();
            s.destroy();
        }


        // Check for touch
        if (Modernizr.touch) {
            // Init Skrollr
            var s = skrollr.init();
            s.destroy();
        }
    }

    function initAdjustWindow() {
        return {
            match: function() {
                adjustWindow();
            },
            unmatch: function() {
                adjustWindow();
            }
        };
    }

    var headerH = $("#HEADER").outerHeight();


    //\\ NAV //\\
    /* Activate nav item on click */
    $('.nav a').click(function() {
        $('.nav li').removeClass('active');
        $(this).parent('li').addClass('active');
    })

    // Mobile only behaviors
    enquire.register("screen and (max-width : 768px)", function() {
        // On hamburger menu click, show nav
        $('.menu-btn').click(function() {
            $('.nav').slideToggle();
            $('.menu-btn').addClass('btn-none');
        });

        // Close nav dropdown on item click
        $('.nav li a').click(function() {
            if (window.innerWidth <= 768) {
                $('.nav').hide();
            }
        });
    });

    // smooooooth scrolling 
    // http://www.sycha.com/jquery-smooth-scrolling-internal-anchor-links
    $(".scroll").click(function(event) {
        event.preventDefault();
        $('html,body').animate({ scrollTop: $(this.hash).offset().top - headerH }, 500);
    });


    // nav highlighting on scroll
    // http://callmenick.com/post/single-page-site-with-smooth-scrolling-highlighted-link-and-fixed-navigation
    var aChildren = $(".nav li").children();
    var aArray = [];
    for (var i = 0; i < aChildren.length; i++) {
        var aChild = aChildren[i];
        var ahref = $(aChild).attr('href');
        aArray.push(ahref);
    }

    $(window).scroll(function() {
        var windowPos = $(window).scrollTop();
        var windowHeight = $(window).height();
        var docHeight = $(document).height();

        for (var i = 0; i < aArray.length; i++) {
            var theID = aArray[i];
            var divPos = $(theID).offset().top - headerH;
            var divHeight = $(theID).height();
            if (windowPos >= divPos && windowPos < (divPos + divHeight)) {
                $("a[href='" + theID + "']").addClass("active");
            } else {
                $("a[href='" + theID + "']").removeClass("active");
            }
        }

        if (windowPos + windowHeight == docHeight) {
            if (!$(".nav li:last-child a").hasClass("active")) {
                var navActiveCurrent = $(".active").attr("href");
                $("a[href='" + navActiveCurrent + "']").removeClass("active");
                $(".nav li:last-child a").addClass("active");
            }
        }
    });

});
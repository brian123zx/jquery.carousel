(function($){

  $.fn.carousel = function( options ) {

    /******
      Requirements:
        jquery
        jqueryui (for easing)
      ToDo:
        timed paging
        infinite looping
    ******/
    
    var carousel = function(elem, options) {
      var _this = this;
      this.$elem = elem;
      this.settings = $.extend({
        usePager: true,
        animationDuration: 1000,
        animationEasing: 'easeInOutCubic', //http://jqueryui.com/demos/effect/easing.html
        initialElement: 0,
        items_per_page: null
      }, options);

      this._set_data(this);


      //wrap in clipping div
      this.$elem.wrap('<div class="carousel_container" />')
      .wrap('<div class="carousel_clip"/>')
      .addClass('carousel_list')
      .find('li').each(function() {
        $(this).addClass('carousel_item');
      });

      this.$container = this.$elem.closest('.carousel_container');
      this.$clip = this.$elem.closest('.carousel_clip');
      this.$elements = this.$elem.find('li');
      this.num_elements = this.$elements.length;
      this.item_width = this.$elem.find('li:first').outerWidth(true);
      if(!this.item_width) this.item_width = 0;
      this._calculate_metrics();

      //calculate width of ul
      this.$elem.css('width', this.item_width * this.num_elements);

      //add navigation elements
      this.$container.append('<div class="carousel_prev" />')
      .append('<div class="carousel_next" />');
      


      //setup pager
      if(this.settings.usePager) {
        this.$container.append('<div class="carousel_pager" />');
        this.$pager = this.$container.find('.carousel_pager');
        this.$container.delegate('.carousel_pager .carousel_page', 'click', {obj: this}, this._pager_click);
        this._setup_pager();
      }


      //bind navigation elements
      this.$container.find('.carousel_prev').bind('click', {obj: this}, this._prev_click);
      this.$container.find('.carousel_next').bind('click', {obj: this}, this._next_click);

      $(window).bind('resize', function() {
        if( !_this.$elem.is(':visible') ) return;
        _this._calculate_metrics();
        if(_this.settings.usePager)
          _this._update_pager;
      });

      //show initial element
      this.current_element = Math.min(Math.max(this.settings.initialElement, 0), this.num_elements-1);
      this._calculate_current_page();
      this.show_element(this.current_element, false);


      if(this.settings.initCallback)
        this.settings.initCallback.apply(this.$elem);


      return this.$elem;
    };
    carousel.prototype._prev_click = function(e) {
      var obj = e.data.obj;
      
      //get element
      var elem = --obj.current_page * obj.items_per_page;
      elem = elem < 0 ? 0 : elem;
      obj.current_page = Math.max(obj.current_page, 0);
      obj.show_element(elem);
    };
    carousel.prototype._next_click = function(e) {
      var obj = e.data.obj;
      
      //get element
      var elem = ++obj.current_page * obj.items_per_page;
      elem = elem >= obj.num_elements ? obj.num_elements-1 : elem;
      obj.current_page = Math.min(obj.current_page, obj.num_pages-1);
      obj.show_element(elem);
    };
    carousel.prototype.show_element = function(num, animate) {
      //figure out page
      var p = Math.floor(num / this.items_per_page);
      this.show_page(p, animate);
    };
    carousel.prototype.show_page = function(num, animate) {
      animate = animate != undefined ? animate : true;
      if(num >= this.num_pages) num = this.num_pages-1;
      var elem_num = num * this.items_per_page;

      if(! $(this.$elements[elem_num]).length) return

      var offset = $(this.$elements[elem_num]).position().left;
      this.current_element = num * this.items_per_page;
      this.current_page = num;
      this.$elem.stop().animate({left: offset*-1}, animate ? this.settings.animationDuration : 0, this.settings.animationEasing);
      this._update_navigation();
      if(this.settings.usePager)
        this._update_pager();
    };
    carousel.prototype._update_navigation = function() {
      //enable/disable prev arrow
      if(this.current_page <= 0 && this.current_element <= 0)
        this.$container.find('.carousel_prev').addClass('disabled');
      else
        this.$container.find('.carousel_prev').removeClass('disabled');

      //enable/disable next arrow
      if(this.current_page >= this.num_pages-1 && this.current_element + this.items_per_page >= this.num_elements)
        this.$container.find('.carousel_next').addClass('disabled');
      else
        this.$container.find('.carousel_next').removeClass('disabled');
    };
    carousel.prototype._calculate_current_page = function() {
      this.current_page = Math.floor(this.current_element / this.items_per_page);
    }
    carousel.prototype._calculate_metrics = function() {
      this.container_width = this.$clip.width();
      this.items_per_page = this.settings.items_per_page ? this.settings.items_per_page : Math.max(Math.floor(this.container_width / this.item_width), 1);

      this.current_element = Math.floor(this.$elem.css('left') == 'auto' ? 0 : this.$elem.css('left').slice(0, -2) * -1 / this.item_width);
      if(!this.current_element) this.current_element = 0;
      this._calculate_current_page();
      var old_num_pages = this.num_pages;
      this.num_pages = Math.ceil(this.num_elements / this.items_per_page);
      if (this.settings.usePager && old_num_pages != this.num_pages)
        this._setup_pager();
    };
    carousel.prototype.get_metrics = function() {
      return {
        items_per_page: this.items_per_page,
        num_pages: this.num_pages,
        current_element: this.current_element,
        container_width: this.container_width
      }
    }
    carousel.prototype._setup_pager = function() {
      if(!this.$pager) return;

      this.$pager.empty();

      this._update_navigation();

      if(this.num_pages < 2) {
        this.$container.removeClass('pager');
        return;
      }

      this.$container.addClass('pager');

      for(var x=0; x<this.num_pages; x++) {
        this.$pager.append('<div class="carousel_page" pageNum="' + x + '" />');
      }
      
      this._update_pager();
      
    };
    carousel.prototype._update_pager = function() {
      
      this.$pager.find('div.carousel_page').removeClass('on');
      this.$pager.find('div.carousel_page:nth-child(' + (this.current_page + 1) + ')').addClass('on');

    };
    carousel.prototype._pager_click = function(e) {
      var obj = e.data.obj;
      obj.current_page = $(e.currentTarget).attr('pageNum') * 1;
      obj.show_element(obj.items_per_page * obj.current_page);
    };
    carousel.prototype.setOptions = function(options) {
      this.settings = $.extend(this.settings, options);
      return this.$elem;
    };
    carousel.prototype.options = function() {
      return this.settings;
    };
    carousel.prototype._get_data = function() {
      var data = this.$elem.data('carousel');
      if(data && typeof data === 'object') return data;

      return {};
    };
    carousel.prototype._set_data = function(d, v) {
      if(typeof d == 'string' && v) {
        var data = this._get_data();
        data[d] = v;
        d = data;
      }

      return this.$elem.data('carousel', d);
    };
    carousel.get_data = function(elem) {
      return elem.data('carousel');
    };
    
    if(carousel.prototype[options] && options.substr(0,1) != '_' && carousel.get_data(this))
      return carousel.prototype[options].apply(carousel.get_data(this), Array.prototype.slice.call(arguments, 1));
    else if(typeof options === 'object' || !options) {
      new carousel(this, options);
      return this;
    }
    else
      return $.error('Cannot call method.  Access is denied.');

  };

})(jQuery);
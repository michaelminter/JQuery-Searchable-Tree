// Require jQuery
// Use jQuery.cookie if you want to restore the previous expansion of the tree

jQuery.fn.tree = function(options) {

  // Setup default options
  /* Avaiable options are:
   *  - open_char: defeault UTF8 character on open node.
   *  - close_char: defeault UTF8 character on close node.
   *  - default_expanded_paths_string: if no cookie found the tree will be expanded with this paths string (default '')
   *      To expand all children use 'all'.
   *      To close all the tree use ''.
   *      To expand the first child and the second child of the first child use '0/1'
   *  - only_one: if this option is true only one child will be expanded at time (default false)
   *  - animation: animation used to expand a child (default 'slow')
   *  - searchbar: creates an input box that allows user to search through list
   *  - autodrop: will drop parent nodes if search result is buried in nest
   */

  if(options === undefined || options === null) options = {};
  var default_options = {
    open_char : '&#9660;',
    close_char : '&#9658;',
    default_expanded_paths_string : '',
    only_one : false,
    animation : 'slow',
    searchbar : true,
    autodrop : true,
    default_search_by_string : '',
    default_search_by_id : ''
  };
  var o = {};
  jQuery.extend(o, default_options, options);

  // Get the expanded paths from the current state of tree
  jQuery.fn.save_paths = function() {
    var paths = [];
    var path = [];
    var open_nodes = jQuery(this).find('li span.open');
    var last_depth = null;
    for(var i = 0; i < open_nodes.length; i++) {
      var depth = jQuery(open_nodes[i]).parents('ul').length-1;
      if((last_depth == null && depth > 0) || (depth > last_depth && depth-last_depth > 1))
        continue;
      var pos = jQuery(open_nodes[i]).parent().prevAll().length;
      if(last_depth == null) {
        path = [pos];
      } else if(depth < last_depth) {
        paths.push(path.join('/'));
        var diff = last_depth - depth;
        path.splice(path.length-diff-1, diff+1);
        path.push(pos);
      } else if(depth == last_depth) {
        paths.push(path.join('/'));
        path.splice(path.length-1, 1);
        path.push(pos);
      } else if(depth > last_depth) {
        path.push(pos);
      }
      last_depth = depth;
    }
    paths.push(path.join('/'));
    try { jQuery.cookie(this.attr('class'), paths.join(',')); }
    catch(e) {}
  };

  // This function expand the tree with 'path'
  jQuery.fn.restore_paths = function() {
    var paths_string = null;
    try { paths_string = jQuery.cookie(this.attr('class')); }
    catch(e) {}
    if(paths_string === null || paths_string === undefined) paths_string = o.default_expanded_paths_string;
    if(paths_string == 'all') {
      jQuery(this).find('span.jtree').open();
    } else {
      var paths = paths_string.split(',');
      for(var i = 0; i < paths.length; i++) {
        var path = paths[i].split('/');
        var obj = jQuery(this);
        for(var j = 0; j < path.length; j++) {
          obj = jQuery(obj.children('li')[path[j]]);
          obj.children('span.jtree').open();
          obj = obj.children('ul')
        }
      }
    }
  };

  // Open a child
  jQuery.fn.open = function(animate) {
    if(jQuery(this).hasClass('jtree')) {
      jQuery(this).parent().children('ul').show(animate);
      jQuery(this).removeClass('close');
      jQuery(this).addClass('open');
      jQuery(this).html(o.open_char);
    }
  };

  // Close a child
  jQuery.fn.close = function(animate) {
    if(jQuery(this).hasClass('jtree')) {
      jQuery(this).parent().children('ul').hide(animate);
      jQuery(this).removeClass('open');
      jQuery(this).addClass('close');
      jQuery(this).html(o.close_char);
    }
  };

  for(var i = 0; i < this.length; i++) {
    if(this[i].tagName === 'UL') {
      // Make a tree
      jQuery(this[i]).find('li').has('ul').prepend('<span class="jtree close" style="cursor:pointer;">' + o.close_char + '</span>');
      jQuery(this[i]).find('ul').hide();
      // Restore cookie expand path
      jQuery(this[i]).restore_paths();
      // Click event
      jQuery(this[i]).find('li > span.jtree').live('click', {tree : this[i]}, function(e) {
        if (jQuery(this).hasClass('open')) {
          jQuery(this).close(o.animation);
          if(o.only_one) jQuery(this).parent('li').siblings().children('span').close(o.animation);
        } else if (jQuery(this).hasClass('close')) {
          jQuery(this).open(o.animation);
          if(o.only_one) jQuery(this).parent('li').siblings().children('span').close(o.animation);
        }
        jQuery(e.data.tree).save_paths();
      });
    }
  }
  
  if (o.searchbar) {
    container = $(this);
    container.before('<div id="tree_searchbar_container"><input type="text" id="tree_searchbar" placeholder="Search" value="' + o.default_search_by_string + '"/><button id="tree_clear_searchbar"></button></div>');
    
    // drop list for default search value
    if (o.default_search_by_string.length > 0) {
      pattern = new RegExp(o.default_search_by_string, "i");
      container.find('li').each(function() {
        if ($(this).text().match(pattern)) {
          $(this).find('a').each(function() {
            if ($(this).text().match(pattern)) {
              $(this).addClass('selected');
            }
          });
          $(this).show();
          if (o.autodrop) {
            $(this).children('span').open(o.animation);
          }
        } else {
          $(this).hide();
        }
      });
    }
    
    if (o.default_search_by_id.length > 0) {
      string  = o.default_search_by_id + "$"
      pattern = new RegExp(string, "i");
      
      container.children('li').children('span').close(o.animation);
      
      container.find('a').each(function() {
        if ($(this).attr('id').match(pattern)) {
          $(this).addClass('selected');
          
          $(this).parentsUntil(container.attr('class')).parent().children('span').open(o.animation);
        }
      });
    }
    
    $('#tree_searchbar').keydown(function(event) {
      if (event.keyCode == 13) {
        // keyCode:13 is 'enter' key
        return false;
      }
    });
    $('#tree_searchbar').keyup(function(event) {
      if ($('input#tree_searchbar').val().length > 0) {
        pattern = new RegExp($('input#tree_searchbar').val(), "i");
        container.find('li').each(function() {
          if ($(this).text().match(pattern)) {
            $(this).show();
            if (o.autodrop) {
              $(this).children('span').open(o.animation);
            }
          } else {
            $(this).hide();
          }
        });
      } else {
        container.find('li').each(function() {
          $(this).show();
        });
      }
    });
    $('#tree_clear_searchbar').click(function(){
      $('#tree_searchbar').val('');
      container.find('li').each(function() {
        $(this).show();
      });
      return false;
    });
  }
}

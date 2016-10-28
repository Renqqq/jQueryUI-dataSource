!function(){

  'use strict';
  /*定义部件初始状态的模板*/
  var tpl = `<div>
              <div style ="border:solid 1px #e6e6e6;height: 200px;overflow: auto;">
                <table class="table table-hover">
                  <tbody>
                    <tr>
                      <td class="text-center" style="vertical-align: middle;">
                        <input type="radio">
                      </td>
                      <td>
                        <input type="text" class="form-control" placeholder="Label" value="option1">
                      </td>
                      <td>
                        <input type="text" class="form-control" placeholder="Value" value="option-1">
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td class="text-center" style="vertical-align: middle;">
                        <input type="radio">
                      </td>
                      <td>
                        <input type="text" class="form-control" placeholder="Label" value="option2">
                      </td>
                      <td>
                        <input type="text" class="form-control" placeholder="Value" value="option-2">
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>  
              </div>
              <button class="btn btn-default pull-right"><span class="glyphicon glyphicon-plus"></span> Add Option</button>
            </div>`;

  $.widget('jqueryui.datasource', {

    /* 定义options */
    options: {

      /**
       * 高度
       */
      height: '',

      /**
       * 数据源
       */
      dataSource: [],

      /* 选中的值 */
      value: '' || [],

      /**
       * 是否支持多选
       */
      multipleSelect: false,

      /**
       * 当选择的option改变时触发此事件
       */
      changeOption: null,

      /**
       * 输入option名称和值时触发此事件
       */
      inputOption: null,

      /**
       * 删除一条option后触发此事件
       */
      afterRemoveOption: null,

      /**
       * 拖拽后触发此事件
       */
      afterDragOption: null
    },

    /* 重写_create方法 */
    _create: function() {
      var self = this;
      this.id = $(this.element).uniqueId().attr('id'); // 获取ID，如果没有ID，通过uniqueId生成
      this.lastTime = null; // 标记时间，输入框触发输入事件时使用

      // 初始化option容器
      this.$container = this._initContainer();

      this.$table = this.$container.find('.table');
      this.$tbody = this.$table.find('tbody');
      this.$button = this.$container.find('button');

      //给默认的两个Option添加事件
      this.$tbody.find('tr').each(function(index,el){
        self._addEvent($(el));
      });
      // 添加拖拽排序功能
      this._sortOption();
      // add option按钮绑定点击事件
      this._addBtnEvent();
    },

    // 重写_init方法
    _init: function() {
      // 设置高度
      this.height(this.options.height);
      // 设置选择方式：单选、多选
      this._selectType(this.options.multipleSelect);
      // 使用datasource初始化组件
      if ($.isArray(this.options.dataSource) &&
        this.options.dataSource.length > 0) {
        this._createOptions(this.options.dataSource);
      }
    },

    _setOption: function(key, value) {
      this._super(key, value);
    },

    _setOptions: function(options) {
      this._super(options);
    },

    _initContainer: function() {
      var $container = $(tpl);
      this.element.empty();
      $container.find('input:radio').attr('name', 'dataSource_' + this.id);
      this.element.append($container);
      return $container;
    },

    _sortOption: function() {
      var self = this;
      this.$tbody.sortable({
        axis: 'y',
        containment: 'document',
        addClasses: false,
        cursor: 'move',
        update: function(event, ui) {
          self._trigger('afterDragOption', event, ui);
        }
      });
      this.$tbody.disableSelection();
    },

    _addBtnEvent: function() {
      var self = this;
      this._on(this.$button, {
        click: function(event) {
          var $newOption = self._createOptionObject();
          self.$tbody.append($newOption);
        }
      });
    },

    _createOptions: function(dataSource) {
      var self = this;
      this.$tbody.find('tr:gt(1)').remove();
      this.$tbody.find('input:text').attr('value', '');
      this.$tbody.find('input[name="dataSource_' + this.id + '"]').prop('checked', false);

      var optionRow = this.$tbody.find('tr');

      /* 通过datasource创建option，前两个option直接设值，
      后面的需要先创建option，然后在设值 */
      _.each(dataSource, function(data, index) {
        var option = optionRow[index];
        if (!option) {
          option = self._createOptionObject();
          self.$tbody.append($(option));
        }
        var optionInput = $(option).find('input:text');
        $(optionInput[0]).attr('value', data.name);
        $(optionInput[1]).attr('value', data.value);
        // data.value和this.options.value比较，如果相同，选中
        self._isSelected(option, data.value);
      });
    },

    _createOptionObject: function() {
      var $optionContainer = $('<tr></tr>');
      // 添加单选按钮或复选框
      $optionContainer.append(this._createRadioOrCheckbox());
      // 添加input输入框
      $optionContainer.append(this._createInput());
      // 添加删除按钮
      $optionContainer.append(this._createDelBtn());
      // 添加事件（输入事件、改变事件、删除按钮点击事件）
      this._addEvent($optionContainer);
      return $optionContainer;
    },

    _createInput: function() {
      // 创建输入框
      var inputHtml = `<td>
                        <input type="text" class="form-control" placeholder="Label">
                      </td>
                      <td>
                        <input type="text" class="form-control" placeholder="Value">
                      </td>`;
      return $(inputHtml);
    },

    _createRadioOrCheckbox: function() {
      // 创建单选按钮或复选框
      var $radioOrCheckboxContainer = $(`<td class="text-center"
                                          style="vertical-align: middle;"></td>`);
      var $input = $('<input type="radio" name="dataSource_' + this.id + '">');
      if (this.options.multipleSelect) {
        $input = $('<input type="checkbox" name="dataSource_' + this.id + '">');
      }

      // 如果this.options.value为空时设置第一项为默认选中的值
      if ($.isEmptyObject(this.options.value) || this.options.value.length <= 0) {
        this.$tbody.find('input:first').prop('checked', true);
      }

      $radioOrCheckboxContainer.append($input);
      return $radioOrCheckboxContainer;
    },

    _createDelBtn: function() {
      // 创建删除按钮
      var delBtnHtml = `<td class="text-center" style="vertical-align: middle;">
                          <span class="glyphicon glyphicon-remove-circle"
                          style="color: black;cursor: pointer;">
                          </span>
                        </td>`;
      return $(delBtnHtml);
    },

    _isSelected: function(option, data) {
      if ($.isArray(this.options.value)) {
        _.each(this.options.value, function(el) {
          if (data === el) {
            $(option).find('input:eq(0)').prop('checked', true);
          }
        });
      } else if (this.options.value === data) {
        $(option).find('input:eq(0)').prop('checked', true);
      }
    },

    _selectType: function(flag) {
      var $select = this.$tbody.find('input[name="dataSource_' + this.id + '"]');
      if (flag) {
        $select.prop('type', 'checkbox');
      } else {
        $select.prop('type', 'radio');
      }
    },

    _addEvent: function($option) {
      var self = this;
      var $changeObj = $option.find('input:eq(0)');
      var $inputObj = $option.find('input:text');
      var $btnObj = $option.find('span');

      // 单选按钮或复选框改变事件
      this._on($changeObj, {
        click: function(event) {
          self._trigger('changeOption');
        }
      });

      // 输入框的input事件
      this._on($inputObj, {
        input: '_changeInput',
        propertychange: '_changeInput'
      });

      // 删除按钮的点击事件
      if($btnObj){
        this._on($btnObj, {
          click: function(event) {
            console.log('remove this option');
            var ui = event.target;
            $option.remove();
            self._trigger('afterRemoveOption', event, ui);
          }
        });
      }    
    },

    _changeInput: function(event) {
      var self = this;
      var ui = event.target;
      this.lastTime = event.timeStamp;
      // 停止输入2秒后没有再次触发此事件，则抛出inputOption事件
      setTimeout(function() {
        if (self.lastTime - event.timeStamp === 0) {
          self._trigger('inputOption', event, ui);
        }
      }, 2000);
    },

    /**
     * 取高度或者设置高度
     * @param  {[String]} value [高度值]
     * @return  高度
     */
    height: function(value) {
      if (value) {
        this.$table.parent('div').height(value);
      } else {
        return this.$table.parent('div').height();
      }
    },

    /**
     * 重载数据
     * @param  {[Array]} newData 用于生成option的数据
     */
    reloadData: function(newData) {
      this._createOptions(newData);
    },

    /**
     * [getDataSource 获取所有数据]
     * @return {Array} datasource中的数据
     */
    getAllData: function() {
      var data = [];
      var $optionRow = this.$tbody.find('tr');
      $optionRow.each(function(index, element) {
        var input = $(element).find('input:text');
        if ($(input[0]).val()&& $(input[1]).val() ) {
          data.push({ name: $(input[0]).val(), value: $(input[1]).val()});
        }     
      });
      return data;
    },

    /**
     * [getSelectedData 获取选中行数据]
     * @return {Object} 选中行数据对象或对象数组
     */
    getSelectedData: function() {
      var data = [];
      var $optionRow = this.$tbody.find('tr');
      $optionRow.each(function(index, el) {
        var input = $(el).find('input:text');
        if ($(el).find('input:eq(0)').prop('checked')) {
          data.push({ name: $(input[0]).val(), value: $(input[1]).val() });
        }
      });

      if (!this.options.multipleSelect) {
        return data[0];
      }
      return data;
    },

    /**
     * [getValue 获取选择的option的值]
     * @return {[type]} [description]
     */
    getValue: function() {
      var data = this.getSelectedData();
      if ($.isArray(data)) {
        var result = [];
        _.each(data, function(ele) {
          result.push(ele.value);
        });
        return result;
      }
      return data.value;
    }

  });
}();




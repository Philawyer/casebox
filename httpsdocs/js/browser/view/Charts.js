Ext.namespace('CB.browser.view');

Ext.define('CB.browser.view.Charts', {
    extend: 'CB.browser.view.Interface'
    ,xtype: 'CBBrowserViewCharts'

    ,border: false
    ,tbarCssClass: 'x-panel-white'
    ,layout: 'border'
    ,params: {
        rows:0
        ,facets: 'general'
    }

    ,initComponent: function(){
        this.instanceId = this.refOwner.instanceId;

        this.facetsCombo = new Ext.form.ComboBox({
            xtype: 'combo'
            ,id: 'facetscombo' + this.instanceId
            ,forceSelection: true
            ,triggerAction: 'all'
            ,lazyRender: true
            ,mode: 'local'
            ,fieldLabel: 'Facets'
            ,labelWidth: 40
            ,editable: false
            ,store: new Ext.data.JsonStore({
                model: 'Generic2'
                ,proxy: {
                    type: 'memory'
                    ,reader: {
                        type: 'json'
                    }
                }
                ,data: []
            })
            ,displayField: 'name'
            ,valueField: 'id'
            ,listeners: {
                scope: this
                ,select: this.onFacetChange
            }
        });

        this.refOwner.buttonCollection.addAll(
            new Ext.Button({
                text: L.ChartArea
                ,id: 'barchart' + this.instanceId
                ,itemId: 'barchart'
                ,enableToggle: true
                ,allowDepress: false
                ,iconCls: 'ib-chart-bar'
                ,iconAlign:'top'
                ,scale: 'large'
                ,toggleGroup: 'cv' + this.instanceId
                ,scope: this
                ,handler: this.onChangeChartClick
            })
            ,new Ext.Button({
                text: L.ChartArea
                ,id: 'columnchart' + this.instanceId
                ,itemId: 'columnchart'
                ,enableToggle: true
                ,allowDepress: false
                ,iconCls: 'ib-chart-column'
                ,iconAlign:'top'
                ,scale: 'large'
                ,toggleGroup: 'cv' + this.instanceId
                ,scope: this
                ,handler: this.onChangeChartClick
            })
            ,new Ext.Button({
                text: L.ChartPie
                ,id: 'piechart' + this.instanceId
                ,itemId: 'piechart'
                ,enableToggle: true
                ,allowDepress: false
                ,iconCls: 'ib-chart-pie'
                ,iconAlign:'top'
                ,scale: 'large'
                ,toggleGroup: 'cv' + this.instanceId
                ,scope: this
                ,handler: this.onChangeChartClick
            })
            ,this.facetsCombo
        );

        this.seriesStyles = [];
        for (var i = 0; i < App.colors.length; i++) {
            this.seriesStyles.push({
                color: App.colors[i]
            });
        }

        this.chartDataStore = new Ext.data.JsonStore({
            autoDestroy: false
            ,fields: ['id', 'name', {name: 'count', type: 'int'}]
            ,model: 'GenericCount'
        });

        this.chartConfigs = {
            'barchart': {
                store: this.chartDataStore
                ,colors: App.colors
                ,flipXY: true
                ,axes: [
                    {
                        type: 'category'
                        ,position: 'left'
                        ,fields: 'name'
                        ,grid: true
                    }, {
                        type: 'numeric'
                        ,position: 'bottom'
                        ,fields: 'count'
                        ,grid: true
                    }
                ]
                ,series: [{
                    type: 'bar'
                    ,xField: 'name'
                    ,yField: 'count'
                    ,style: {
                        opacity: 0.80
                        ,minGapWidth: 10
                    }
                    ,highlight: {
                        fillStyle: 'rgba(249, 204, 157, 1.0)'
                        ,strokeStyle: 'black'
                        ,radius: 10
                    }
                    ,label: {
                        field: 'count'
                        ,display: 'insideEnd'
                    }
                    ,listeners: {
                        scope: this
                        ,itemclick: this.onChartItemClick
                    }
                }]
            }
            ,'columnchart': {
                store: this.chartDataStore
                ,colors: App.colors
                ,axes: [{
                        type: 'numeric'
                        ,position: 'left'
                        ,adjustByMajorUnit: true
                        ,fields: ['count']
                        ,grid: true
                    }, {
                        type: 'category'
                        ,position: 'bottom'
                        ,fields: ['name']
                        ,grid: true
                    }
                ]
                ,series: [{
                    type: 'column'
                    ,xField: 'name'
                    ,yField: ['count']
                    ,stacked: true
                    ,highlight: {
                        fillStyle: 'yellow'
                    }
                    ,label: {
                        field: 'count'
                        ,display: 'insideEnd'
                    }
                    ,listeners: {
                        scope: this
                        ,itemclick: this.onChartItemClick
                    }
                }]
            }
            ,'piechart': {
                store: this.chartDataStore
                ,series: [{
                    type: 'pie',
                    angleField: 'count',
                    label: {
                        field: 'name',
                        display: 'outside',
                        calloutLine: true
                    },
                    showInLegend: true,
                    highlight: true,
                    highlightCfg: {
                        'stroke-width': 20,
                        stroke: '#fff'
                    }
                    ,listeners: {
                        scope: this
                        ,itemclick: this.onChartItemClick
                    }
                }]
            }
        };

        this.chartContainer = new Ext.Panel({
            region: 'center'
            ,layout: 'fit'
        });

        Ext.apply(this, {
            title: L.Charts
            ,header: false
            ,items: this.chartContainer
            ,listeners: {
                scope: this
                ,activate: this.onActivate
            }
        });
        CB.browser.view.Charts.superclass.initComponent.apply(this, arguments);
        this.currentButton = this.refOwner.buttonCollection.get('barchart' + this.instanceId);

        this.selectedFacets = [];
        this.store.on('load', this.onStoreLoad, this);
    }

    ,getViewParams: function() {
        return this.params;
    }

    ,onActivate: function() {
        this.fireEvent(
            'settoolbaritems'
            ,[
                ,'linechart'
                ,'barchart'
                ,'stackedbarchart'
                ,'columnchart'
                ,'stackedcolumnchart'
                ,'piechart'
                ,'-'
                ,'facetscombo'
            ]
        );
    }

    ,onChangeChartClick: function(b, e) {
        b.toggle(true);
        this.currentButton = b;
        this.loadChartData();

        this.chartContainer.removeAll(true);

        this.chart = Ext.create(
            'Ext.chart.Chart'
            ,this.chartConfigs[b.itemId]
        );
        this.chartContainer.add(this.chart);
    }

    ,loadAvailableFacets: function() {
        var data = [];

        Ext.iterate(
            this.data
            ,function(key, val, o) {
                if(Ext.isEmpty(this.selectedFacets)) {
                    this.selectedFacets = [key];
                }
                data.push({
                    id: key
                    ,name: Ext.valueFrom(val['title'], L['facet_'+key])
                });
            }
            ,this
        );

        /* there is some Ext bug on first combobox display
            When expanding it - it has no data
        */
        var st = this.facetsCombo.store;
        st.removeAll();
        st.loadData(data);
        this.facetsCombo.setValue(this.selectedFacets[0]);
    }

    ,loadChartData: function() {
        var data = {};
        Ext.iterate(
            this.data
            ,function(key, val, o) {
                data[key] = CB.FacetList.prototype.getFacetData(key, val.items);
                for (var i = 0; i < data[key].length; i++) {
                    if(Ext.isObject(data[key][i].items)) {
                        data[key][i].name = data[key][i].items.name;
                        data[key][i].count = data[key][i].items.count;
                    } else {
                        data[key][i].count = data[key][i].items;
                    }
                    data[key][i].name = App.shortenString(data[key][i].name, 30);
                }
            }
            ,this
        );
        this.chartData = data;
        if(data[this.selectedFacets[0]]) {
            this.chartDataStore.loadData(data[this.selectedFacets[0]]);
        } else {
            this.chartDataStore.removeAll();
        }
    }

    ,onStoreLoad: function(store, recs, successful, eOpts) {
        if(!this.rendered ||
            !this.getEl().isVisible(true) ||
            (successful !== true)
        ) {
            return;
        }
        this.data = store.proxy.reader.rawData.facets;
        this.loadAvailableFacets();
        this.onChangeChartClick(this.currentButton);
    }

    ,onChartItemClick: function(o, event){
        var params = {
            view: 'grid'
            ,filters: Ext.apply({}, this.store.extraParams.filters)
        };
        var filterBy = this.facetsCombo.getValue();
        params['filters'][filterBy] = [{
            f: filterBy
            ,mode: 'OR'
            ,values: [o.storeItem.get('id')]
        }];

        this.fireEvent('changeparams', params);
    }

    ,onFacetChange: function(combo, records, index) {
        this.selectedFacets[0] = records[0].get('id');
        this.onChangeChartClick(this.currentButton);
    }
});

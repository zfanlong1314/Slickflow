﻿/*
* Slickflow 工作流引擎遵循LGPL协议，也可联系作者商业授权并获取技术支持；
* 除此之外的使用则视为不正当使用，请您务必避免由此带来的商业版权纠纷。

The Slickflow Designer project.
Copyright (C) 2014  .NET Workflow Engine Library

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, you can access the official
web page about lgpl: https://www.gnu.org/licenses/lgpl.html
*/

var processManager;
if (!processManager) processManager = {};

(function () {
    pselectedProcessGUID = null;

    //#region Process DataGrid
    processManager.getProcessList = function () {
        $("#spinner").show();

        jshelper.ajaxGet('/SfApi/api/Wf2Xml/GetProcessList', null, function (result) {
            if (result.Status === 1) {
                var columnProcess = [
                    { id: "ID", name: "ID", field: "ID", width: 40, cssClass: "bg-gray" },
                    { id: "ProcessGUID", name: "流程GUID", field: "ProcessGUID", width: 120, cssClass: "bg-gray" },
                    { id: "ProcessName", name: "流程名称", field: "ProcessName", width: 160, cssClass: "bg-gray" },
                    { id: "AppType", name: "App标识", field: "AppType", width: 120, cssClass: "bg-gray" },
                    { id: "XmlFilePath", name: "文件名称", field: "XmlFilePath", width: 200, cssClass: "bg-gray" }
                ];

                var optionsProcess = {
                    editable: true,
                    enableCellNavigation: true,
                    enableColumnReorder: true,
                    asyncEditorLoading: true,
                    forceFitColumns: false,
                    topPanelHeight: 25
                };

                var dsProcess = result.Entity;

                var dvProcess = new Slick.Data.DataView({ inlineFilters: true });
                var gridProcess = new Slick.Grid("#myGridProcess", dvProcess, columnProcess, optionsProcess);

                dvProcess.onRowsChanged.subscribe(function (e, args) {
                    gridProcess.invalidateRows(args.rows);
                    gridProcess.render();
                });

                dvProcess.onRowCountChanged.subscribe(function (e, args) {
                    gridProcess.updateRowCount();
                    gridProcess.render();
                });

                dvProcess.beginUpdate();
                dvProcess.setItems(dsProcess, "ID");
                gridProcess.setSelectionModel(new Slick.RowSelectionModel());
                dvProcess.endUpdate();

                //rows change event
                gridProcess.onSelectedRowsChanged.subscribe(function (e, args) {
                    var selectedRowIndex = args.rows[0];
                    var row = dvProcess.getItemByIdx(selectedRowIndex);
                    if (row) {
                        //marked and returned selected row info
                        processManager.pselectedProcessGUID = row.ProcessGUID;

                        processManager.display(row);
                    }
                });
            }

            $("#spinner").hide();
        });
    }

    processManager.display = function (entity) {
        $("#txtProcessName").val(entity.ProcessName);
        $("#txtAppType").val(entity.AppType);
        $("#txtProcessFileName").val(entity.XmlFileName);
        $("#txtDescription").val(entity.Description);
    }

    processManager.createProcess = function () {
        //check the input validation
        if ($("#txtProcessName").val() == ""
            || $("#txtProcessName").val() == ""
            || $("#txtAppType").val() == "") {
            $.msgBox({
                title: "Designer / Process",
                content: "请输入流程基本信息！",
                buttons: [{ value: "Ok" }],
            });

            return;
        }
        var entity = {
            "ProcessName": $("#txtProcessName").val(),
            "XmlFileName": $("#txtProcessFileName").val(),
            "AppType": $("#txtAppType").val(),
            "Description": $("#txtDescription").val()
        };

        jshelper.ajaxPost('/SfApi/api/Wf2Xml/CreateProcess',
            JSON.stringify(entity),
            function (result) {
                if (result.Status == 1) {
                    $.msgBox({
                        title: "Designer / Process",
                        content: "流程记录已经成功创建，可以在主面板创建图形了！",
                        type: "info"
                    });

                    //refresh
                    processManager.pselectedProcessGUID = result.Entity.ProcessGUID;         //var processGUID = result.Entity.ProcessGUID;

                    //close dialog
                    window.parent.$('#divProcessDialog').dialog('close');
                } else {
                    $.msgBox({
                        title: "Ooops",
                        content: result.Message,
                        type: "error",
                        buttons: [{ value: "Ok" }],
                    });
                }
            });
    }

    processManager.updateProcess = function () {
        var processGUID = processManager.pselectedProcessGUID;
        var entity = {
            "ProcessGUID": processGUID,
            "ProcessName": $("#txtProcessName").val(),
            "XmlFileName": $("#txtProcessFileName").val(),
            "AppType": $("#txtAppType").val(),
            "Description": $("#txtDescription").val()
        };

        jshelper.ajaxPost('/SfApi/api/Wf2Xml/UpdateProcess',
            JSON.stringify(entity),
            function (result) {
                if (result.Status == 1) {
                    $.msgBox({
                        title: "Designer / Process",
                        content: "流程成功保存！",
                        type: "info"
                    });
                } else {
                    $.msgBox({
                        title: "Ooops",
                        content: result.Message,
                        type: "error",
                        buttons: [{ value: "Ok" }],
                    });
                }
            });
    }

    processManager.deleteProcess = function () {
        $.msgBox({
            title: "Are You Sure",
            content: "确实要删除流程定义记录吗? ",
            type: "confirm",
            buttons: [{ value: "Yes" }, { value: "Cancel" }],
            success: function (result) {
                if (result == "Yes") {
                    var entity = {
                        "ProcessGUID": processManager.pselectedProcessGUID
                    };

                    //delete the selected row
                    jshelper.ajaxPost('/SfApi/api/Wf2Xml/DeleteProcess',
                        JSON.stringify(entity),
                        function (result) {
                            if (result.Status == 1) {
                                $.msgBox({
                                    title: "Designer / Process",
                                    content: "流程记录已经删除！",
                                    type: "info"
                                });

                                //refresh
                                processManager.getProcessList();
                            } else {
                                $.msgBox({
                                    title: "Ooops",
                                    content: result.Message,
                                    type: "error",
                                    buttons: [{ value: "Ok" }],
                                });
                            }
                        });

                    return;
                }
            }
        });
    }
})()
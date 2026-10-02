package com.ruoyi.pm.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 原型项目历史版本对象 pm_project_version
 */
public class PmProjectVersion extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 版本ID */
    private Long id;

    /** 项目ID */
    private Long projectId;

    /** 版本号 */
    private Integer version;

    /** 画布内容快照 */
    private String content;

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getProjectId()
    {
        return projectId;
    }

    public void setProjectId(Long projectId)
    {
        this.projectId = projectId;
    }

    public Integer getVersion()
    {
        return version;
    }

    public void setVersion(Integer version)
    {
        this.version = version;
    }

    public String getContent()
    {
        return content;
    }

    public void setContent(String content)
    {
        this.content = content;
    }

    @Override
    public String toString()
    {
        return new ToStringBuilder(this, ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("projectId", getProjectId())
            .append("version", getVersion())
            .append("createTime", getCreateTime())
            .toString();
    }
}

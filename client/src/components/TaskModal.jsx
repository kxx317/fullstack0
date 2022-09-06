import {
  Backdrop,
  Fade,
  IconButton,
  Modal,
  Box,
  TextField,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Moment from "moment";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import taskApi from "../api/taskApi";

import "./custom-editor.css";

const modalStyle = {
  outline: "none",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "50%",
  bgcolor: "background.paper",
  border: "0px solid #000",
  boxShadow: 24,
  p: 1,
  height: "80%",
};

let isModalClosed = false;

const TaskModal = (props) => {
  const boardId = props.boardId;
  const [task, setTask] = useState(props.task);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const editorWrapperRef = useRef();

  const [timerRunningState, setTimerRunningState] = useState(false);

  useEffect(() => {
    setTask(props.task);
    setTitle(props.task !== undefined ? props.task.title : "Untitled");
    setContent(
      props.task !== undefined
        ? props.task.content
        : "Add Description to task here"
    );
    setTimerRunningState(
      props.task !== undefined ? props.task.timerRunning : false
    );
    if (props.task !== undefined) {
      isModalClosed = false;

      updateEditorHeight();
    }
  }, [props.task]);

  const updateEditorHeight = () => {
    if (editorWrapperRef.current) {
      const box = editorWrapperRef.current;
      box.querySelector(".ck-editor__editable_inline").style.height =
        box.offsetHeight - 50 + "px";
    }
  };

  const onClose = () => {
    isModalClosed = true;
    props.onUpdate(task);
    props.onClose();
  };

  const deleteTask = async () => {
    try {
      await taskApi.delete(boardId, task.id);
      props.onDelete(task);
      setTask(undefined);
    } catch (err) {
      alert(err);
    }
  };

  const updateTitle = async (e) => {
    const newTitle = e.target.value;

    try {
      await taskApi.update(boardId, task.id, { title: newTitle });
    } catch (err) {
      alert(err);
    }

    task.title = newTitle;
    setTitle(newTitle);
    props.onUpdate(task);
  };

  const updateContent = async (event, editor) => {
    const data = editor.getData();

    if (!isModalClosed) {
      try {
        await taskApi.update(boardId, task.id, { content: data });
      } catch (err) {
        alert(err);
      }

      task.content = data;
      setContent(data);
      props.onUpdate(task);
    }
  };

  const handleTimerStart = async () => {
    console.log("handleTimerStart");
    try {
      const updatedTask = await taskApi.update(boardId, task.id, {
        timerStart: Date.now(),
        timerRunning: true,
      });
      task.timerStart = updatedTask.timerStart;
      task.timerRunning = true;
      setTask(task);
      props.onUpdate(task);
    } catch (err) {
      alert(err);
    }
  };

  const handleTimerEnd = async () => {
    console.log("handleTimerEnd");
    try {
      const endTime = Date.now();
      const duration = endTime - task.timerStart;
      console.log(endTime, task.timerStart, duration);
      console.log("duration", duration);
      await taskApi.update(boardId, task.id, {
        timerEnd: endTime,
        timerRunning: false,
        timerDuration: duration,
      });
      task.timerEnd = endTime;
      task.timerRunning = false;
      task.timerDuration = duration;
      setTask(task);
      props.onUpdate(task);
    } catch (err) {
      alert(err);
    }
  };
  return (
    <Modal
      open={task !== undefined}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={task !== undefined}>
        <Box sx={modalStyle}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <IconButton variant="outlined" color="error" onClick={deleteTask}>
              <DeleteOutlinedIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: "flex",
              height: "100%",
              flexDirection: "column",
              padding: "2rem 5rem 5rem",
            }}
          >
            <TextField
              value={title}
              onChange={updateTitle}
              placeholder="Untitled"
              variant="outlined"
              fullWidth
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-input": { padding: 0 },
                "& .MuiOutlinedInput-notchedOutline": { border: "unset " },
                "& .MuiOutlinedInput-root": {
                  fontSize: "2.5rem",
                  fontWeight: "700",
                },
                marginBottom: "10px",
              }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" fontWeight="700">
                {task !== undefined
                  ? Moment(task.createdAt).format("YYYY-MM-DD")
                  : ""}
              </Typography>
              <Button
                onClick={timerRunningState ? handleTimerEnd : handleTimerStart}
              >
                {task !== undefined && timerRunningState ? ( // if timer is started
                  <Typography variant="body2" fontWeight="700">
                    {Moment(Date.now() - task.timerStart).format("mm:ss")}
                  </Typography>
                ) : (
                  <Typography variant="body2" fontWeight="700">
                    Start Timer
                  </Typography>
                )}
              </Button>
            </Box>
            <Divider sx={{ margin: "1.5rem 0" }} />
            <Box
              ref={editorWrapperRef}
              sx={{
                position: "relative",
                height: "80%",
                overflowX: "hidden",
                overflowY: "auto",
              }}
            >
              <CKEditor
                editor={ClassicEditor}
                data={content}
                onChange={updateContent}
                onFocus={updateEditorHeight}
                onBlur={updateEditorHeight}
              />
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default TaskModal;